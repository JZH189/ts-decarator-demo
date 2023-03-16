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
//定义一个类装饰器
const classDecorator = (constructor) => {
    constructor.prototype.members = [
        {
            name: "高启强",
            company: "京海建工集团",
        },
    ];
};
//定义一个方法装饰器
const methodDecorator = (target, propertyKey, descriptor) => {
    //设置Greeter.greet方法不可以被修改
    descriptor.writable = false;
};
//定义一个属性装饰器
const doNothing = (target, propertyKey) => {
    console.log("target: ", target);
    console.log("propertyKey: ", propertyKey);
};
//定义一个参数装饰器
const required = (target, propertyKey, parameterIndex) => {
    //需要验证的参数序号
    const requiredParams = [];
    requiredParams.push(parameterIndex);
    Reflect.defineMetadata(requiredMetadataKey, requiredParams, target, propertyKey);
};
//定义一个方法装饰器
const validateDecorator = (target, propertyKey, descriptor) => {
    let method = descriptor.value;
    descriptor.value = function () {
        const requiredParams = Reflect.getMetadata(requiredMetadataKey, target, propertyKey) || [];
        if (requiredParams.length) {
            for (let parameterIndex of requiredParams) {
                if (parameterIndex >= arguments.length ||
                    arguments[parameterIndex] === undefined) {
                    throw new Error("Missing required argument.");
                }
            }
        }
        return method.apply(this, arguments);
    };
};
let Greeter = class Greeter {
    constructor(message = "风浪越大鱼越贵！") {
        this.greeting = message;
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
const greeter = new Greeter();
// @ts-ignore
greeter.findName(); //throw new Error("Missing required argument.");
greeter.greet();
greeter.greet = () => "Hello"; //会提示 TypeError: Cannot assign to read only property 'greet' of object '#<Greeter>'
