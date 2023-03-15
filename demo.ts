import "reflect-metadata";

const formatMetadataKey = Symbol("format");

function format(formatString: string) {
  return Reflect.metadata(formatMetadataKey, formatString);
}

function getFormat(target: any, propertyKey: string) {
  return Reflect.getMetadata(formatMetadataKey, target, propertyKey);
}
interface Igreet {
  name: string;
  company: string;
}

let introduction: Igreet = {
  name: "victor",
  company: "jinhai",
};

//定义一个类装饰器
const freeze: ClassDecorator = (constructor: Function) => {
  Object.freeze(constructor);
  Object.freeze(constructor.prototype);
};
//定义一个方法装饰器
const otherFunc: MethodDecorator = (
  target: any,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  descriptor.value = () => console.log("greet 方法被我修改了");
};

@freeze
class Greeter {
  @format("Hello, %s")
  greeting: Igreet;

  constructor(message: Igreet) {
    this.greeting = message;
  }

  // @otherFunc
  greet() {
    console.log(this.greeting);
    console.log(`Hello, ${this.greeting.name}!`);
  }
}
const greeter = new Greeter(introduction);
greeter.greet();
greeter.greet = () => "Hello"; //会提示 TypeError: Cannot assign to read only property 'greet' of object '#<Greeter>' 禁止修改greet对象
