# A websocket server to be used for third party web sites for push notifications to all online users

## Motivation

The back end stack of the company where I work requires occasional update when all services go offline.
Even though we usually have this outage planned just placing a message on main page is not usually enough because our web site
is a single page application completely cached in browser.

There is a need to be able to communicate to all users that are online or will be online soon about an upcoming down time.
And we believe that this is quite a common scenario in modern websites that can be covered by an independent service.

This messaging service is platform agnostic and does not require anything more than adding a JS file to HTML page and a javascript
callback to listen for messages.

## Design

## Queues

### to test from command line
