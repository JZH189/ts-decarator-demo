import "reflect-metadata";

const requiredMetadataKey = Symbol("required");
interface Imember {
  name: string;
  company: string;
}
//定义一个类装饰器
const classDecorator = (constructor: Function) => {
  console.log("类装饰器");
  constructor.prototype.members = [
    {
      name: "高启强",
      company: "京海建工集团",
    },
  ];
};
//定义一个方法装饰器
const methodDecorator = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  //设置Greeter.greet方法不可以被修改
  descriptor.writable = false;
};

//定义一个属性装饰器
const doNothing = (
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
  console.log("方法装饰器");
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
//定义一个访问器装饰器工厂函数
const configurable = (value: boolean) => {
  console.log("访问器装饰器");
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.configurable = value;
  };
}
@classDecorator
class Greeter {
  private helloWord: string;
  members!: Imember[];
  @doNothing
  greeting: string;

  constructor(message: string = "风浪越大鱼越贵！") {
    this.greeting = message;
    this.helloWord = "什么档次，跟我用一样的电视机？";
  }

  /**
   * 注意  TypeScript不允许同时装饰一个成员的 get 和 set 访问器。
   * 取而代之的是，一个成员的所有装饰的必须应用在文档顺序的第一个访问器上。
   * 这是因为，在装饰器应用于一个属性描述符时，它联合了get和set访问器，而不是分开声明的。
   * */
  @configurable(false)
  get helloWordTxt() {
    return this.helloWord;
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
greeter.findName('高启强'); 
greeter.greet();
greeter.greet = () => "Hello"; //会提示 TypeError: Cannot assign to read only property 'greet' of object '#<Greeter>'
