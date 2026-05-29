import type { Condition } from "./types.ts";

export class WhereBuilder {
  private _path: string;
  private _operator?: "eq" | "ref" | "in" | "matches";
  private _value?: unknown;

  constructor(path: string) {
    this._path = path;
  }

  equals(value: unknown): this {
    this._operator = "eq";
    this._value = value;
    return this;
  }

  ref(path: string): this {
    this._operator = "ref";
    this._value = path;
    return this;
  }

  in(values: unknown[]): this {
    this._operator = "in";
    this._value = values;
    return this;
  }

  matches(regex: string): this {
    this._operator = "matches";
    this._value = new RegExp(regex);
    return this;
  }

  build(): Condition {
    if (this._operator === undefined) {
      throw new Error("No operator set on WhereBuilder");
    }
    return {
      type: "where",
      path: this._path,
      operator: this._operator,
      value: this._value,
    };
  }
}

export class ChainedWhereBuilder<TParent> {
  private _path: string;
  private _onCondition: (condition: Condition) => TParent;

  constructor(path: string, onCondition: (condition: Condition) => TParent) {
    this._path = path;
    this._onCondition = onCondition;
  }

  equals(value: unknown): TParent {
    const wb = new WhereBuilder(this._path);
    return this._onCondition(wb.equals(value).build());
  }

  ref(path: string): TParent {
    const wb = new WhereBuilder(this._path);
    return this._onCondition(wb.ref(path).build());
  }

  in(values: unknown[]): TParent {
    const wb = new WhereBuilder(this._path);
    return this._onCondition(wb.in(values).build());
  }

  matches(regex: string): TParent {
    const wb = new WhereBuilder(this._path);
    return this._onCondition(wb.matches(regex).build());
  }
}
