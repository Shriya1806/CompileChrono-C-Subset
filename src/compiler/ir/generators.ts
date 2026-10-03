export class TemporaryGenerator {
  private index = 0;
  next() {
    this.index += 1;
    return `t${this.index}`;
  }
}

export class LabelGenerator {
  private index = 0;
  next() {
    this.index += 1;
    return `L${this.index}`;
  }
}
