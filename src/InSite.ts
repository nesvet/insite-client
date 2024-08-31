import EventEmitter from "eventemitter3";
import { CookieSetter } from "insite-cookie/client";
import { InSiteWebSocket } from "insite-ws/client";
import { IncomingTransport, OutgoingTransport } from "insite-ws-transfers/browser";
import type { AbilitiesSchema } from "insite-common";
import { Subscription } from "insite-subscriptions-client";
import {
	type CurrentUser,
	type Orgs,
	type OrgsExtended,
	type Roles,
	type Users,
	type UsersExtended,
	UsersSubscriptionGroup
} from "insite-users-client";
import type { InSiteWithActualProps, Options } from "./types";


/* eslint-disable @typescript-eslint/no-explicit-any */


declare global {
	var __insite: { // eslint-disable-line no-var
		wss_url?: string;
	} | undefined;
}


/** @this InSite */
function login(this: InSite<any, any>, email: string, password: string) {
	return this.ws.sendRequest("login", email, password);
}

/** @this InSite */
function logout(this: InSite<any, any>) {
	return this.ws.sendRequest("logout");
}


export class InSite<AS extends AbilitiesSchema, O extends Options<AS>> extends EventEmitter {
	constructor(options?: O) {
		super();
		
		this.initPromise = this.init!(options);
		
	}
	
	ws!: InSiteWebSocket;
	incomingTransport!: IncomingTransport;
	outgoingTransport!: OutgoingTransport;
	cookie!: CookieSetter;
	usersSubscriptionGroup!: UsersSubscriptionGroup;
	user!: CurrentUser<AS> | null;
	users!: Users | UsersExtended;
	orgs!: Orgs | OrgsExtended;
	roles!: Roles;
	isLoggedIn = false;
	
	login!: typeof login;
	logout!: typeof logout;
	
	isReady = false;
	
	private init? = async (options?: O) => {
		
		const {
			ws: wsWithOtherOptions = {},
			cookie: cookieOptions,
			users
		} = options ?? {};
		
		const {
			subscriptions,
			incomingTransport,
			outgoingTransport,
			...wsOptions
		} = wsWithOtherOptions;
		
		wsOptions.url ??= globalThis.__insite?.wss_url;
		
		if (!wsOptions.url)
			throw new Error("options.ws.url or INSITE_CLIENT_WSS_URL have to be set");
		
		this.ws = new InSiteWebSocket(wsOptions);
		
		if (subscriptions !== null)
			Subscription.bindTo(this.ws);
		
		if (incomingTransport)
			this.incomingTransport = new IncomingTransport(this.ws, typeof incomingTransport == "object" ? incomingTransport : {});
		
		if (outgoingTransport)
			this.outgoingTransport = new OutgoingTransport(this.ws);
		
		if (cookieOptions !== null)
			this.cookie = new CookieSetter(this.ws, cookieOptions);
		
		if (users !== null && subscriptions !== null && cookieOptions !== null) {
			this.user = null;
			this.login = login;
			this.logout = logout;
			
			this.usersSubscriptionGroup = new UsersSubscriptionGroup({ target: this });
			
			await new Promise<void>(resolve => {
				
				this.usersSubscriptionGroup.once("init", () => {
					
					this.isLoggedIn = !!this.user;
					
					this.usersSubscriptionGroup.on("update.user", (user: CurrentUser) => {
						if (user.valueOf()) {
							if (!this.isLoggedIn) {
								this.isLoggedIn = true;
								this.emit("login", true);
							}
						} else if (this.isLoggedIn) {
							this.isLoggedIn = false;
							this.emit("logout", false);
						}
						
					});
					
					resolve();
					
					if (this.isLoggedIn)
						this.emit("login", true);
					
				});
				
			});
		}
		
		this.isReady = true;
		this.emit("ready", true);
		
	};
	
	private initPromise;
	
	whenReady() {
		return this.initPromise;
	}
	
	
	static init<IO extends Options<any>>(options: IO) {
		type IAS = IO extends Options<infer EIAS> ? EIAS : never;
		
		return new InSite(options) as InSiteWithActualProps<InSite<IAS, IO>, IO>;
	}
	
}
