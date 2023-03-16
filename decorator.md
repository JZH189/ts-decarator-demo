如果对ts装饰器的概念比较熟悉的同学可以直接从 <a href="#example">代码示例</a> 处开始。
## ts装饰器

随着TypeScript和ES6里引入了类，在一些场景下我们需要额外的特性来支持标注或修改类及其成员。 装饰器（Decorators）为我们在类的声明及成员上通过元编程语法添加标注提供了一种方式。 Javascript里的装饰器目前处在 [建议征集的第二阶段](https://github.com/tc39/proposal-decorators)，但在TypeScript里已做为一项实验性特性予以支持。

若要启用实验性的装饰器特性，你必须在命令行或tsconfig.json里启用 experimentalDecorators编译器选项：

tsconfig.json:
```json
{
  "compilerOptions": {
      "target": "ES5",
      "experimentalDecorators": true
  }
}
```

装饰器是一种特殊类型的声明，它能够被附加到类声明，方法， 访问符，属性或参数上。 装饰器使用 @expression这种形式，expression求值后必须为一个函数，它会在运行时被调用，被装饰的声明信息做为参数传入。多个装饰器可以同时应用到一个声明上。

书写在同一行上：
```ts
@f @g x
```

书写在多行上：
```ts
@f
@g
x
```
当多个装饰器应用于一个声明上，它们求值方式与复合函数相似。在这个模型下，当复合f和g时，复合的结果等同于f(g(x))。
## ts装饰器的五种类型定义：

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

//访问器装饰器（作用于get/set）
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

## <a href="#" id="example">example</a>

我们来看下面的案例, demo.ts:

定义一个 Greeter 类并应用五种装饰器：
```ts
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
```

我们借助 <font color="#bf414a">reflect-metadata</font> 库来支持实验性的 [metadata API](https://github.com/rbuckton/reflect-metadata)。再加上装饰器的方法定义如下：

```ts
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
```

最后运行代码试试：

```ts
const greeter = new Greeter();
greeter.findName("高启强"); //成功查询到“高启强”
greeter.greet(); //console.log => 风浪越大鱼越贵！
greeter.greet = () => "Hello"; //会提示 TypeError: Cannot assign to read only property 'greet' of object '#<Greeter>'
```
demo.ts的完整代码如下：

```ts
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

```
## ts 装饰器语法底层实现原理分析

我们将上面的 demo.ts 文件编译后得到 demo.js：

```ts
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const requiredMetadataKey = Symbol("required");
//...
let Greeter = class Greeter {
    constructor(message = "风浪越大鱼越贵！") {
        this.greeting = message;
        this.helloWord = "什么档次，跟我用一样的电视机？";
    }
    /**
     * 注意  TypeScript不允许同时装饰一个成员的 get 和 set 访问器。
     * 取而代之的是，一个成员的所有装饰的必须应用在文档顺序的第一个访问器上。
     * 这是因为，在装饰器应用于一个属性描述符时，它联合了get和set访问器，而不是分开声明的。
     * */
    get helloWordTxt() {
        return this.helloWord;
    }
    findName(name) {
        const members = this.members || [];
        const member = members.find((item) => item.name === name);
        if (member) {
            console.log(member);
        }
        else {
            console.log("您查找的用户不存在!");
        }
    }
    greet() {
        console.log(this.greeting);
    }
};
__decorate([
    doNothing,
    __metadata("design:type", String)
], Greeter.prototype, "greeting", void 0);
__decorate([
    configurable(false),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], Greeter.prototype, "helloWordTxt", null);
__decorate([
    validateDecorator,
    __param(0, required),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], Greeter.prototype, "findName", null);
__decorate([
    methodDecorator,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Greeter.prototype, "greet", null);
Greeter = __decorate([
    classDecorator,
    __metadata("design:paramtypes", [String])
], Greeter);
//...
```
通过观察编译后的代码可以发现，其实 ts 中支持的 **<font color="#bf414a">装饰器</font>**语法主要由<font color="#bf414a">\_\_decorate</font>这个方法来实现的。\_\_decorate 内部借助了 <font color="#bf414a">Object.defineProperty(target, key, r)</font> api 来实现，总共代码不过十行！

### \_\_decorate 分析

```js
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    /**
     * c表示参数对象length属性
     * r表示target或者desc
     * d表示装饰器的方法
    */
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
      d;
    //判断当前运行环境是否支持Reflect.decorate方法
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    //使用Object.defineProperty(target, key, r)操作类或者类的属性或者类的方法
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
```

上面方法首先判断 this 上有没有定义\_\_decorate，没有的话就定义一个函数。该函数接收四个参数：

- decorators： 由装饰器方法组成的装饰器数组参数。
- target：操作的目标对象。类似于 Object.defineProperty(target, key, descriptor)操作的 target
- key: 操作的目标对象的 key。类似于 Object.defineProperty(target, key, descriptor)操作的 key
- desc: 操作的目标对象的 desc。类似于 Object.defineProperty(target, key, descriptor)操作的 descriptor

\_\_decorate 方法内部分别定义了变量：c，r，d。其中的 c 代表其参数个数的 length。如果传给\_\_decorate 方法的参数个数 < 3 的话 r 就代表参数 target，否则 r 代表 desc。desc 的求值就很简单。如果 desc === null 的话则**使用 Object.getOwnPropertyDescriptor(target, key) 去获取 target 对象上一个自有属性对应的属性描述符**，否则就是传入的 desc。d 表示用户定义的装饰器方法。

然后就是判断当前环境是否支持 Reflect.decorate 方法（截止到发文它还未被写入 ES 标准），如果当前运行环境不支持 Reflect.decorate 则代码会走 else 的逻辑。else 逻辑中首先在 for 循环中采用从数组尾部到首部依次取出对应的 decorator，并且判断如果存在装饰器方法 d 则执行 d(target, key, r) 或者 d(target, key) 即三目运算中的 c > 3 ? d(target, key, r) : d(target, key)) 这段逻辑。执行完装饰器 d 的逻辑（暂且称为 d(...args)）之后再根据\_\_decorate 的参数个数来判断，如果参数个数 < 3 则运行 d(r)，此时的 d(r)就相当于 d(target)，否则运行 d(...args)。

最后一行代码需要解释下运行逻辑：

```js
return c > 3 && r && Object.defineProperty(target, key, r), r;

//return c > 3 && r && expression, r; 的意思是如果expression前面的条件都为 true的话则会执行 expression然后返回 r。

//举个例子
function ex() {
  return 1 > 0 && console.log(1), 6;
}
ex(); //会先console.log(1) 然后turn 6
```

> 其实这种写法可以理解为一个偷懒的写法，省略了 if-else 的逻辑。但是可能会给别人造成困惑。不知道你们对这种写法怎么看？

因此我们弄明白了 return c > 3 && r && Object.defineProperty(target, key, r), r; 这行代码最终一定会返回 r。

## 装饰器的执行顺序

为了清楚的看到各装饰器在类上的执行顺序，我在装饰器方法中添加console.log代码，然后会看到控制台依次打印：

```ts
属性装饰器
访问器装饰器
参数装饰器
方法装饰器
类装饰器
```
其实我们通过最终编译过后的demo.js文件也能看出来：

```js
//...
//属性装饰器应用到类属性
__decorate([
    doNothing,
    __metadata("design:type", String)
], Greeter.prototype, "greeting", void 0);
//访问器装饰器应用到get方法
__decorate([
    configurable(false),
    __metadata("design:type", Object),
    __metadata("design:paramtypes", [])
], Greeter.prototype, "helloWordTxt", null);
//参数装饰器应用到方法的参数上
__decorate([
    validateDecorator,
    __param(0, required),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], Greeter.prototype, "findName", null);
//方法装饰器应用到类的方法
__decorate([
    methodDecorator,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Greeter.prototype, "greet", null);
//类装饰器应用到类
Greeter = __decorate([
    classDecorator,
    __metadata("design:paramtypes", [String])
], Greeter);
//...
```

其实类中不同声明上的装饰器将按以下规定的顺序应用：

- <font color="#bf414a">属性装饰器应用到类的属性成员</font>
- <font color="#bf414a">参数装饰器，然后依次是方法装饰器，访问符装饰器（方法装饰器和访问符装饰器的执行顺序取决于他们两者之中谁先在类中定义，即在类中的代码位置）。</font>
- <font color="#bf414a">类装饰器应用到类。</font>

## 总结

最后总结下：

<font color="#bf414a">ts 装饰器的底层其实就是使用了 Object.defineProperty(target, key, descriptor) 的方法去精确地添加或修改或替换类或类成员行为的函数。从而达到装饰目标对象的目的。</font>

- <font color="#bf414a">每种类型的装饰器都会传递一组特定的参数:</font>
  - <font color="#bf414a">类装饰器采用类构造函数</font>
  - <font color="#bf414a">方法、访问器、参数装饰器都是采用类构造函数或类原型(对于静态成员来说是类的构造函数，对于实例成员是类的原型对象),名称，属性描述符</font>
  - <font color="#bf414a">属性装饰器采用类构造函数或类原型(对于静态成员来说是类的构造函数，对于实例成员是类的原型对象),名称。</font>

注意: 
> 属性描述符不会做为参数传入属性装饰器，这与 TypeScript 是如何初始化属性装饰器的有关。 因为目前没有办法在定义一个原型对象的成员时描述一个实例属性，并且没办法监视或修改一个属性的初始化方法。返回值也会被忽略。因此，属性描述符只能用来监视类中是否声明了某个名字的属性。
>
> TypeScript不允许同时装饰一个成员的get和set访问器。取而代之的是，一个成员的所有装饰的必须应用在文档顺序的第一个访问器上。这是因为，在装饰器应用于一个属性描述符时，它联合了get和set访问器，而不是分开声明的。

