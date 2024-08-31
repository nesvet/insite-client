import type { Options as CookieOptions } from "insite-cookie/client";
import type { Options as WSOptions } from "insite-ws/client";
import type { AnyProp, ExtendsOrOmit } from "@nesvet/n";
import type { AbilitiesSchema } from "insite-common";
import type { IncomingTransportOptions } from "insite-ws-transfers";


/* eslint-disable @typescript-eslint/no-explicit-any */


type WSSubscriptions = true;
type WSIncomingTransport = IncomingTransportOptions | true;
type WSOutgoingTransport = true;
type WS = {
	subscriptions?: null | WSSubscriptions;
	incomingTransport?: null | WSIncomingTransport;
	outgoingTransport?: null | WSOutgoingTransport;
} & WSOptions;
type Cookie = CookieOptions;
type Users<AS extends AbilitiesSchema> = {
	abilities?: AS;
};


export type Options<AS extends AbilitiesSchema> = {
	ws?: WS;
	cookie?: Cookie | null;
	users?: Users<AS>;
};


type OptionsWithWSSubscriptions = { ws?: { subscriptions?: WSSubscriptions } & AnyProp } & AnyProp;
type OptionsWithWSIncomingTransport = { ws: { incomingTransport: WSIncomingTransport } & AnyProp } & AnyProp;
type OptionsWithWSOutgoingTransport = { ws: { outgoingTransport: WSOutgoingTransport } & AnyProp } & AnyProp;
type OptionsWithCookie = { cookie?: Cookie } & AnyProp;
type OptionsWithUsers = { users?: Users<any> } & OptionsWithCookie & OptionsWithWSSubscriptions;


export type InSiteWithActualProps<IS, O> =
	ExtendsOrOmit<O, OptionsWithWSIncomingTransport, "incomingTransport",
		ExtendsOrOmit<O, OptionsWithWSOutgoingTransport, "outgoingTransport",
			ExtendsOrOmit<O, OptionsWithCookie, "cookie",
				ExtendsOrOmit<O, OptionsWithUsers, "isLoggedIn" | "login" | "logout" | "orgs" | "roles" | "user" | "users" | "usersSubscriptionGroup",
					IS
				>
			>
		>
	>;
