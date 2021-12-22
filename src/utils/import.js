/* https://webpack.js.org/guides/dependency-management/#context-module-api */
export function importAll(r) {
    const modules = {};
    r.keys().forEach(key => modules[key] = r(key));
    return modules;
}
