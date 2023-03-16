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

我们来看下面的案例, demo.ts:

```ts
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
```

上面示例代码中的 Greeter 类分别结合了 <font color="#bf414a">类装饰器</font>、<font color="#bf414a">属性装饰器</font>、<font color="#bf414a">方法装饰器</font>、<font color="#bf414a">参数装饰器</font>

我们借助 <font color="#bf414a">reflect-metadata</font> 库来支持实验性的 [metadata API](https://github.com/rbuckton/reflect-metadata)。再加上装饰器的方法定义如下：

```ts
import "reflect-metadata";

const requiredMetadataKey = Symbol("required");
interface Imember {
  name: string;
  company: string;
}
//定义一个类装饰器
const classDecorator: ClassDecorator = (constructor: Function) => {
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
  //设置Greeter.greet方法不可以被修改
  descriptor.writable = false;
};

//定义一个属性装饰器
const doNothing: PropertyDecorator = (
  target: Object,
  propertyKey: string | symbol
) => {
  console.log("target: ", target);
  console.log("propertyKey: ", propertyKey);
};

//定义一个参数装饰器
const required = (
  target: Object,
  propertyKey: string | symbol,
  parameterIndex: number
) => {
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
```

最后运行代码试试：

```ts
const greeter = new Greeter();
greeter.findName("高启强"); //成功查询到“高启强”
greeter.greet();
greeter.greet = () => "Hello"; //会提示 TypeError: Cannot assign to read only property 'greet' of object '#<Greeter>'
```

## ts 装饰器语法实现底层原理分析

我们将上面的 demo.ts 文件编译后得到 demo.js 之后会看到如下代码：

```shell
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
```

通过观察可以发现，其实 ts 中支持的 **<font color="#bf414a">装饰器</font>**语法主要借助了 <font color="#bf414a">\_\_decorate</font>这个方法来实现的。它的底层还是借助了 <font color="#bf414a">Object.defineProperty(target, key, r)</font> api 来实现，总共代码不过十行！

### \_\_decorate 分析

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

上面方法首先判断 this 上有没有定义\_\_decorate，没有的话就定义一个函数。该函数接收四个参数：

- decorators： 由装饰器方法组成的装饰器数组参数。
- target：操作的目标对象。类似于 Object.defineProperty(target, key, descriptor)操作的 target
- key: 操作的目标对象的 key。类似于 Object.defineProperty(target, key, descriptor)操作的 key
- desc: 操作的目标对象的 desc。类似于 Object.defineProperty(target, key, descriptor)操作的 descriptor

\_\_decorate 方法内部分别定义了变量：c，r，d。其中的 c 代表其参数的 length。如果传给\_\_decorate 方法的参数个数 < 3 的话 r 就代表参数 target，否则 r 代表 desc。desc 的求值就很简单。如果 desc === null 的话则使用 Object.getOwnPropertyDescriptor(target, key) 去**获取 target 对象上一个自有属性对应的属性描述符**，否则就是传入的 desc。d 表示用户定义的装饰器方法。

然后就是判断当前环境是否支持 Reflect.decorate 方法（截止到发文它还未被写入 ES 标准），如果当前运行环境不支持 Reflect.decorate 则代码运行 else 的逻辑。

else 逻辑中首先在 for 循环中采用从数组尾部到首部依次取出对应的 decorator，并且判断如果存在装饰器方法 d 则执行 d(target, key, r) 或者 d(target, key) 即三目运算中的 c > 3 ? d(target, key, r) : d(target, key)) 这段逻辑。执行完装饰器 d 的逻辑（暂且称为 d(...args)）之后再根据\_\_decorate 的参数个数来判断，如果参数个数 < 3 则运行 d(r) 否则运行 d(...args) 。此时的 d(r)就相当于 d(target)。

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

> 其实这种写法就理解为一个偷懒的写法，省略了 if-else 的逻辑。但是可能会给别人造成困惑。不知道你们怎么看这种写法？

最后我们明白了 return c > 3 && r && Object.defineProperty(target, key, r), r; 这行代码最终一定会返回 r。

看到这里我们也得出了结论：

- ts 装饰器的底层其实就是使用了 Object.defineProperty(target, key, descriptor) 的方法去精确地添加或修改对象的属性。从而达到装饰目标对象的目的。
- 装饰器只是一个允许您观察，修改或替换类或类成员行为的函数
- 有四种类型的装饰器：类装饰器，方法装饰器(和访问器装饰器一致)，属性装饰器，参数装饰器
- 每种类型的装饰器都会传递一组特定的参数:
  - 类装饰器采用类构造函数
  - 方法、访问器、参数装饰器都是采用类构造函数或类原型(取决于它们是静态还是实例成员),名称，属性描述符
  - 属性装饰器采用类构造函数或类原型(取决于它们是静态还是实例成员),名称。

> 注意: 属性描述符不会做为参数传入属性装饰器，这与 TypeScript 是如何初始化属性装饰器的有关。 因为目前没有办法在定义一个原型对象的成员时描述一个实例属性，并且没办法监视或修改一个属性的初始化方法。返回值也会被忽略。因此，属性描述符只能用来监视类中是否声明了某个名字的属性。

##
