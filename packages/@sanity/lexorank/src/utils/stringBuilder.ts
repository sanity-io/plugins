class StringBuilder {
  [index: number]: string | undefined

  private str: string

  constructor(str = '') {
    this.str = str
  }

  get length() {
    return this.str.length
  }

  set length(value: number) {
    this.str = this.str.substring(0, value)
  }

  public append(str: string): StringBuilder {
    this.str = this.str + str
    return this
  }

  public remove(startIndex: number, length: number): StringBuilder {
    this.str = this.str.slice(0, startIndex) + this.str.slice(startIndex + length)
    return this
  }

  public insert(index: number, value: string): StringBuilder {
    this.str = this.str.slice(0, index) + value + this.str.slice(index)
    return this
  }

  public toString(): string {
    return this.str
  }
}

export default StringBuilder
