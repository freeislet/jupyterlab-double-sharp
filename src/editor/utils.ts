import { Facet, Compartment, Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

declare module '@codemirror/state' {
  namespace Facet {
    /**
     * 여러 Input 중 첫 번째(high-precedence) 값으로 combine하는 Facet을 define
     * @param default_ Input 값이 없을 때의 default 값
     */
    function defineCombined<Input>(default_: Input): Facet<Input, Input>;
  }
}

Facet.constructor.prototype.defineCombined = function <Input>(default_: Input) {
  return Facet.define<Input, Input>({
    combine: values => (values.length ? values[0] : default_)
  });
};

/**
 * Configurable Facet class
 * Compartment, Facet 함께 사용
 */
class ConfigFacet<Input, Output> {
  readonly compartment: Compartment;

  constructor(public readonly facet: Facet<Input, Output>) {
    this.compartment = new Compartment();
  }

  /**
   * Compartment instance 생성
   */
  instance(value: Input): Extension {
    return this.compartment.of(this.facet.of(value));
  }

  /**
   * view에 새로운 value 적용
   */
  apply(view: EditorView, value: Input) {
    view.dispatch({
      effects: this.compartment.reconfigure(this.facet.of(value))
    });
  }

  // 도움 함수

  /**
   * Facet.define으로부터 생성
   */
  static define<Input, Output = readonly Input[]>(
    config?: Parameters<typeof Facet.define<Input, Output>>[0]
  ): ConfigFacet<Input, Output> {
    const facet = Facet.define<Input, Output>(config);
    return new ConfigFacet(facet);
  }

  /**
   * Facet.defineCombined로부터 생성
   */
  static defineCombined<Input>(default_: Input): ConfigFacet<Input, Input> {
    const facet = Facet.defineCombined(default_);
    return new ConfigFacet(facet);
  }
}

export { ConfigFacet };
