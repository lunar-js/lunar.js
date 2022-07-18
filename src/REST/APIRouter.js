"use strict";

const noop = () => {}; // eslint-disable-line no-empty-function
const methods = ["get", "post", "delete", "patch", "put"];
const reflectors = [
  "toString",
  "valueOf",
  "inspect",
  "constructor",
  Symbol.toPrimitive,
  Symbol.for("nodejs.util.inspect.custom"),
];

function buildRoute(manager) {
  const route = [""];
  const handler = {
    get(target, name) {
      if (reflectors.includes(name)) return () => route.join("/");
      if (methods.includes(name)) {
        const routeBucket = [];
        for (let i = 0; i < route.length; i++) {
          if (route[i - 1] === "reactions") break;
          if (
            /\d{16,19}/g.test(route[i]) &&
            !/channels|guilds/.test(route[i - 1])
          )
            routeBucket.push(":id");
          else routeBucket.push(route[i]);
        }
        return (options) =>
          manager.request(
            name,
            route.join("/"),
            Object.assign(
              { versioned: manager.versioned, route: routeBucket.join("/") },
              options
            )
          );
      }
      route.push(name);
      return new Proxy(noop, handler);
    },
    apply(target, _, args) {
      route.push(...args.filter((x) => x != null)); // eslint-disable-line eqeqeq
      return new Proxy(noop, handler);
    },
  };
  return new Proxy(noop, handler);
}

module.exports = buildRoute;
