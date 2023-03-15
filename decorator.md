```ts
//类装饰器
declare type ClassDecorator = <TFunction extends Function>(
  target: TFunction
) => TFunction | void;

//属性装饰器
declare type PropertyDecorator = (
  target: Object,
  propertyKey: string | symbol
) => void;

//方法装饰器
declare type MethodDecorator = <T>(
  target: Object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T> | void;

//参数装饰器
declare type ParameterDecorator = (
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) => void;
```

## example

如下实现了一个类装饰器, demo.ts:

```ts
const sealed: ClassDecorator = (constructor: Function) => {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
};

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
  greet() {
    return "Hello, " + this.greeting;
  }
}

const greeter = new Greeter("高启强");
console.log(greeter.greet()); // Hello, 高启强
```

## ts 装饰器语法实现底层原理分析

我们将上面的 demo.ts 文件编译后得到 demo.js:

```js
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
const sealed = (constructor) => {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
};
let Greeter = class Greeter {
  greeting;
  constructor(message) {
    this.greeting = message;
  }
  greet() {
    return "Hello, " + this.greeting;
  }
};
Greeter = __decorate(
  [sealed, __metadata("design:paramtypes", [String])],
  Greeter
);
const greeter = new Greeter("高启强");
console.log(greeter.greet());
```

通过观察可以发现，其实 ts 中支持的 **<font color="#bf414a">装饰器</font>**语法主要借助了 <font color="#bf414a">\_\_decorate</font> 和 <font color="#bf414a">\_\_metadata</font> 两个方法来实现。这两个方法的代码行数总共不超过 10 行！

### \_\_decorate

```js
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
```

\_\_decorate 首先判断 this 上有没有实现它，没有的话就定义了一个函数。该函数接收四个参数，
