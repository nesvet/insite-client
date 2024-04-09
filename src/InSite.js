import EventEmitter from "eventemitter3";
import { CookieSetter } from "insite-cookie/client";
import { Subscription } from "insite-subscriptions-client";
import { UsersSubscriptionGroup } from "insite-users-client";
import { WebSocket } from "insite-ws/client";
import { RequestSender } from "insite-ws-requests";
import { OutgoingTransport } from "insite-ws-transfers/browser/outgoing";


export class InSite extends EventEmitter {
	constructor({ wss = globalThis.__insite?.wss_url } = {}) {
		super();
		
		if (!wss)
			throw new Error("wss or INSITE_CLIENT_WSS_URL have to be set");
		
		this.ws = new WebSocket(wss);
		
		new RequestSender(this.ws);
		
		new OutgoingTransport(this.ws);
		
		new CookieSetter(this.ws);
		
		
		Subscription.bindTo(this.ws);
		
		
		this.usersSubscriptionGroup = new UsersSubscriptionGroup({ target: this });
		
		this.usersSubscriptionGroup.once("init", this.#handleUsersSubscriptionGroupInit);
		
	}
	
	isInited = false;
	
	user = null;
	
	isLoggedIn = false;
	
	#handleUsersSubscriptionGroupInit = () => {
		
		this.isInited = true;
		this.isLoggedIn = !!this.user;
		
		this.usersSubscriptionGroup.on("update.user", this.#handleUsersSubscriptionUserUpdate);
		
		if (this.isLoggedIn)
			this.emit("login", true);
		
		this.emit("init", true);
		
	};
	
	#handleUsersSubscriptionUserUpdate = user => {
		if (user.valueOf()) {
			if (!this.isLoggedIn) {
				this.isLoggedIn = true;
				this.emit("login", true);
			}
		} else
			if (this.isLoggedIn) {
				this.isLoggedIn = false;
				this.emit("logout", false);
			}
		
		
	};
	
	login(...args) {
		return this.ws.sendRequest("login", ...args);
	}
	
	logout(...args) {
		return this.ws.sendRequest("logout", ...args);
	}
	
}
