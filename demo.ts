import "reflect-metadata";

const requiredMetadataKey = Symbol("required");
interface Imember {
  name: string;
  company: string;
}
//定义一个类装饰器
const classDecorator: ClassDecorator = (constructor: Function) => {
  console.log("类装饰器");
  constructor.prototype.members = [
    {
      name: "高启强",
      company: "京海建工集团",
    },
  ];
};
//定义一个方法装饰器
const methodDecorator: MethodDecorator = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  console.log("方法装饰器");
  //设置Greeter.greet方法不可以被修改
  descriptor.writable = false;
};

//定义一个属性装饰器
const doNothing: PropertyDecorator = (
  target: Object,
  propertyKey: string | symbol
) => {
  console.log("属性装饰器");
  //do nothing
};

//定义一个参数装饰器
const required = (
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) => {
  console.log("参数装饰器");
  //需要验证的参数序号
  const requiredParams: number[] = [];
  requiredParams.push(parameterIndex);
  Reflect.defineMetadata(
    requiredMetadataKey,
    requiredParams,
    target,
    propertyKey
  );
};
//定义一个方法装饰器
const validateDecorator = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  let method = descriptor.value;
  descriptor.value = function () {
    const requiredParams: number[] =
      Reflect.getMetadata(requiredMetadataKey, target, propertyKey) || [];
    if (requiredParams.length) {
      for (let parameterIndex of requiredParams) {
        if (
          parameterIndex >= arguments.length ||
          arguments[parameterIndex] === undefined
        ) {
          throw new Error("Missing required argument.");
        }
      }
    }
    return method.apply(this, arguments);
  };
};
@classDecorator
class Greeter {
  members!: Imember[];
  @doNothing
  greeting: string;

  constructor(message: string = "风浪越大鱼越贵！") {
    this.greeting = message;
  }

  @validateDecorator
  findName(@required name: string) {
    const members: Imember[] = this.members || [];
    const member = members.find((item) => item.name === name);
    if (member) {
      console.log(member);
    } else {
      console.log("您查找的用户不存在!");
    }
  }

  @methodDecorator
  greet() {
    console.log(this.greeting);
  }
}

const greeter = new Greeter();
// @ts-ignore
greeter.findName(); //throw new Error("Missing required argument.");
greeter.greet();
greeter.greet = () => "Hello"; //会提示 TypeError: Cannot assign to read only property 'greet' of object '#<Greeter>'
