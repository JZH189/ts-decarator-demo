"use strict";
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
let introduction = {
  name: "victor",
  company: "jinhai",
};
//定义一个类装饰器
const freeze = (constructor) => {
  Object.freeze(constructor);
  Object.freeze(constructor.prototype);
};
//装饰器工厂返回一个方法装饰器
function enumerable(value: boolean) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    descriptor.enumerable = value;
  };
}
let Greeter = class Greeter {
  greeting;
  constructor(message) {
    this.greeting = message;
  }
  greet() {
    return `Hello, ${this.greeting.name}!`;
  }
};
__decorate(
  [
    editeIntroduction(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0),
  ],
  Greeter.prototype,
  "greet",
  null
);
Greeter = __decorate(
  [freeze, __metadata("design:paramtypes", [Object])],
  Greeter
);
const greeter = new Greeter(introduction);
// greeter.greet = () => "Hello"; //会提示 TypeError: Cannot assign to read only property 'greet' of object '#<Greeter>' 禁止修改greet对象
console.log(greeter.greet());
