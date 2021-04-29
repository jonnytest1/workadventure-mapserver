//requires "useDefineForClassFields": true, intsconfig.json
export function assignDeclaredProperties<T>(constructor: new () => T, obj: any): T {

    const element = new constructor();
    const properties = Object.getOwnPropertyNames(element);

    for (const name of properties) {
        element[name] = obj[name];
    }

    return element;
}