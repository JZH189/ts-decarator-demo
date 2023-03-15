import "reflect-metadata";

const formatMetadataKey = Symbol("metadataKey");
const requiredMetadataKey = Symbol("required");

const required = (
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) => {
  let existingRequiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey) || [];
  existingRequiredParameters.push(parameterIndex);
  Reflect.defineMetadata(requiredMetadataKey, existingRequiredParameters, target, propertyKey);
}

const validate = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  let method = descriptor.value;
  descriptor.value = function () {
    let requiredParameters: number[] = Reflect.getOwnMetadata(requiredMetadataKey, target, propertyKey);
    if (requiredParameters) {
      for (let parameterIndex of requiredParameters) {
        if (
          parameterIndex >= arguments.length ||
          arguments[parameterIndex] === undefined
        ) {
          throw new Error("Missing required argument.");
        }
      }
    }
    return (method as Function).apply(this, arguments);
  };
};
//定义一个类装饰器
const classDecorator: ClassDecorator = (constructor: Function) => {
  constructor.prototype.introduction = {
    name: '高启强',
    company: '京海建工集团',
  };
};
//定义一个方法装饰器
const methodDecorator: MethodDecorator = (
  target: Object,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => {
  //设置Greeter.greet方法不可以被修改
  descriptor.writable = false;
};

//定义一个属性装饰器工厂函数
const propertyDescriptor = (val: string): PropertyDecorator => (
  target: any,
  propertyKey: string | symbol
) => {
  Reflect.defineMetadata(formatMetadataKey, val, target, propertyKey)
}

const parameterDecorator: ParameterDecorator = (
  target: any,
  propertyKey: string | symbol,
  parameterIndex: number
) => {
  console.log('target: ', target);
  console.log('propertyKey: ', propertyKey);
  console.log('parameterIndex: ', parameterIndex);
}

@classDecorator
class Greeter {
  greeting: string;
  @propertyDescriptor("风浪越大鱼越贵！")
  word?: string;

  constructor(@parameterDecorator message: string = "有事找强哥") {
    this.greeting = message;
  }

  @validate
  getWord(@required word: string) {
    const result = Reflect.getMetadata(formatMetadataKey, this, word);
    console.log(result);
  }

  @methodDecorator
  greet() {
    console.log(this.greeting);
  }
}

const greeter = new Greeter();
greeter.greet()
// console.log('greeter.introduction;: ', (greeter as any).introduction); //{ name: '高启强', company: '京海建工集团', word: '风浪越大鱼越贵！' }
// greeter.greet = () => "Hello"; //会提示 TypeError: Cannot assign to read only property 'greet' of object '#<Greeter>' 禁止修改greet对象
