import type { AnyProp, ExtendsOrOmit } from "@nesvet/n";
import type { AbilitiesSchema } from "insite-common";
import type { Options as CookieOptions } from "insite-cookie/client";
import type { IncomingTransportOptions } from "insite-ws-transfers";
import type { WithOnTransfer, WithTransfer } from "insite-ws-transfers/browser";
import type { InSiteWebSocket, Options as WSOptions } from "insite-ws/client";


/* eslint-disable @typescript-eslint/no-explicit-any */


type WSSubscriptions = true;
type WSIncomingTransport = IncomingTransportOptions | true;
type WSOutgoingTransport = true;
type WS = WSOptions & {
	subscriptions?: WSSubscriptions | null;
	incomingTransport?: WSIncomingTransport | null;
	outgoingTransport?: WSOutgoingTransport | null;
};
type Cookie = CookieOptions;
type Users<AS extends AbilitiesSchema> = {
	abilities?: AS;
};


export type Options<AS extends AbilitiesSchema> = {
	ws?: WS;
	cookie?: Cookie | null;
	users?: Users<AS> | null;
};


type OptionsWithWSSubscriptions = AnyProp & { ws?: AnyProp & { subscriptions?: WSSubscriptions } };
type OptionsWithWSIncomingTransport = AnyProp & { ws: AnyProp & { incomingTransport: WSIncomingTransport } };
type OptionsWithWSOutgoingTransport = AnyProp & { ws: AnyProp & { outgoingTransport: WSOutgoingTransport } };
type OptionsWithCookie = AnyProp & { cookie?: Cookie };
type OptionsWithUsers = OptionsWithCookie & OptionsWithWSSubscriptions & { users?: Users<any> };


export type OmitRedundant<I, O> =
	ExtendsOrOmit<O, OptionsWithWSIncomingTransport, "incomingTransport",
		ExtendsOrOmit<O, OptionsWithWSOutgoingTransport, "outgoingTransport",
			ExtendsOrOmit<O, OptionsWithCookie, "cookie",
				ExtendsOrOmit<O, OptionsWithUsers, "isLoggedIn" | "login" | "logout" | "orgs" | "roles" | "user" | "users" | "usersSubscriptionGroup",
					I
				>
			>
		>
	>;


type OptionalTransfer<O, W extends InSiteWebSocket> =
	O extends OptionsWithWSOutgoingTransport ?
		WithTransfer<W> :
		W;

type OptionalOnTransfer<O, W extends InSiteWebSocket> =
	O extends OptionsWithWSIncomingTransport ?
		WithOnTransfer<W> :
		W;

export type InSiteWebSocketWithActualProps<O> =
	OptionalTransfer<O,
		OptionalOnTransfer<O,
			InSiteWebSocket
		>
	>;
