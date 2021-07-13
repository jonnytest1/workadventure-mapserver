const jsonClasses: Array<ClassDecorator> = []
function parseJson(str: string) {
    try {
        str = JSON.parse(str)
    } catch (e) {
    }
    try {
        return JSON.parse(str);
    } catch (e) {
        const parts = str.split(":")
        const classStr = parts.shift();
        const classRef = jsonClasses.find(jsonClass => jsonClass.name == classStr);
        const obj = JSON.parse(parts.join(':'))
        Object.setPrototypeOf(obj, classRef.prototype)
        return obj;
    }
}
function JsonParser(target) {
    jsonClasses.push(target)
}
@JsonParser
class JsonTest {
    public attribute1 = "123"
    public attribute2 = {
        test: 123
    }
    public toJSON(...key) {
        return this.constructor.name + ":" + JSON.stringify(Object.assign({}, this))
    }
}
describe('test', () => {
    it('json', () => {
        const obj = new JsonTest()
        const objStr = JSON.stringify(obj);
        expect(objStr)
            .toBe('"JsonTest:{\\"attribute1\\":\\"123\\",\\"attribute2\\":{\\"test\\":123}}"');
        const newObj = parseJson(objStr)
        if (!(newObj instanceof JsonTest)) {
            throw new Error("didnt work")
        }
    });
});