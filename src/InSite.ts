import EventEmitter from "eventemitter3";
import { StatefulPromise } from "@nesvet/n";
import type { AbilitiesSchema } from "insite-common";
import { CookieSetter } from "insite-cookie/client";
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
import { IncomingTransport, OutgoingTransport } from "insite-ws-transfers/browser";
import { InSiteWebSocket } from "insite-ws/client";
import type { InSiteWithActualProps, Options } from "./types";


declare global {
	var __insite: undefined | { // eslint-disable-line no-var
		wss_url?: string;
	};
}


/** @this InSite */
function login<AS extends AbilitiesSchema, O extends Options<AS>>(this: InSite<AS, O>, email: string, password: string) {
	return this.ws.sendRequest("login", email, password);
}

/** @this InSite */
function logout<AS extends AbilitiesSchema, O extends Options<AS>>(this: InSite<AS, O>) {
	return this.ws.sendRequest("logout");
}


export class InSite<AS extends AbilitiesSchema, O extends Options<AS>> extends EventEmitter {
	constructor(options?: O) {
		super();
		
		this.init(options);
		
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
	
	login!: typeof login<AS, O>;
	logout!: typeof logout<AS, O>;
	
	isReady = false;
	
	protected async init(options?: O) {
		
		if (!this.isReady) {
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
				this.login = login<AS, O>;
				this.logout = logout<AS, O>;
				
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
			
			this.#initPromise.resolve(this);
		}
		
	}
	
	#initPromise = new StatefulPromise<this>();
	
	whenReady() {
		return this.#initPromise;
	}
	
	
	static init<IAS extends AbilitiesSchema, IO extends Options<IAS>, IS extends InSite<IAS, IO>>(this: new (options: Options<IAS>) => IS, options: IO, asPromise?: true): Promise<InSiteWithActualProps<IS, IO>>;
	static init<IAS extends AbilitiesSchema, IO extends Options<IAS>, IS extends InSite<IAS, IO>>(this: new (options: Options<IAS>) => IS, options: IO, asPromise?: false): InSiteWithActualProps<IS, IO>;
	static init<IAS extends AbilitiesSchema, IO extends Options<IAS>, IS extends InSite<IAS, IO>>(this: new (options: Options<IAS>) => IS, options: IO, asPromise = true) {
		const inSite = new InSite(options);
		
		return asPromise ?
			inSite.whenReady() as Promise<InSiteWithActualProps<InSite<IAS, IO>, IO>> :
			inSite as InSiteWithActualProps<InSite<IAS, IO>, IO>;
	}
	
}
