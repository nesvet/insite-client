import EventEmitter from "eventemitter3";
import { CookieSetter } from "insite-cookie/client";
import { Subscription } from "insite-subscriptions-client";
import { UsersSubscriptionGroup } from "insite-users-client";
import { WebSocket } from "insite-ws/client";
import { RequestSender } from "insite-ws-requests";
import { OutgoingTransport } from "insite-ws-transfers/browser/outgoing";


export class InSite extends EventEmitter {
	constructor({ wssurl = process.env.INSITE_WSS }) {
		super();
		
		if (!wssurl)
			throw new Error("wssurl or INSITE_WSS have to be set");
		
		if (!/^wss?:\/\//.test(wssurl))
			wssurl =
				/^https?:\/\//.test(wssurl) ?
					wssurl.replace(/^http(s?):\/\//, "ws$1://") :
					`wss://${wssurl}`;
		
		this.ws = new WebSocket(wssurl);
		
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
