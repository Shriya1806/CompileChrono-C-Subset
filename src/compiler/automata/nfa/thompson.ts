import type { RegexNode } from "../regex/regexAst";
import type { AutomataState, AutomataTransition, NFA, TransitionSymbol } from "../models";
import { EPSILON } from "../models";

interface Fragment {
  start: string;
  accept: string;
  states: AutomataState[];
  transitions: AutomataTransition[];
}

class IdFactory {
  private stateIndex = 0;
  private transitionIndex = 0;

  state(): AutomataState {
    const id = `q${this.stateIndex++}`;
    return { id, label: id };
  }

  transition(from: string, to: string, symbol: TransitionSymbol): AutomataTransition {
    return {
      id: `t${this.transitionIndex++}`,
      from,
      to,
      symbol
    };
  }
}

export function regexToNfa(regex: RegexNode, id = "nfa"): NFA {
  const factory = new IdFactory();
  const fragment = build(regex, factory);
  return {
    id,
    regex,
    states: fragment.states,
    transitions: fragment.transitions,
    startState: fragment.start,
    acceptStates: [fragment.accept]
  };
}

function build(node: RegexNode, factory: IdFactory): Fragment {
  switch (node.kind) {
    case "epsilon":
      return primitive(factory, EPSILON);
    case "literal":
      return primitive(factory, { kind: "literal", value: node.value, label: node.value });
    case "charClass":
      return primitive(factory, { kind: "charClass", label: node.label, chars: node.chars, ranges: node.ranges, negate: node.negate });
    case "concat":
      return concatenate(node.parts.map((part) => build(part, factory)), factory);
    case "alternate":
      return alternate(node.options.map((option) => build(option, factory)), factory);
    case "star":
      return star(build(node.expr, factory), factory);
    case "plus":
      return plus(build(node.expr, factory), factory);
    case "optional":
      return optional(build(node.expr, factory), factory);
  }
}

function primitive(factory: IdFactory, symbol: TransitionSymbol): Fragment {
  const start = factory.state();
  const accept = factory.state();
  return {
    start: start.id,
    accept: accept.id,
    states: [start, accept],
    transitions: [factory.transition(start.id, accept.id, symbol)]
  };
}

function concatenate(parts: Fragment[], factory: IdFactory): Fragment {
  if (parts.length === 0) return primitive(factory, EPSILON);
  const [first, ...rest] = parts;
  return rest.reduce((left, right) => ({
    start: left.start,
    accept: right.accept,
    states: [...left.states, ...right.states],
    transitions: [...left.transitions, ...right.transitions, factory.transition(left.accept, right.start, EPSILON)]
  }), first);
}

function alternate(options: Fragment[], factory: IdFactory): Fragment {
  const start = factory.state();
  const accept = factory.state();
  return {
    start: start.id,
    accept: accept.id,
    states: [start, accept, ...options.flatMap((option) => option.states)],
    transitions: [
      ...options.flatMap((option) => [
        factory.transition(start.id, option.start, EPSILON),
        factory.transition(option.accept, accept.id, EPSILON),
        ...option.transitions
      ])
    ]
  };
}

function star(fragment: Fragment, factory: IdFactory): Fragment {
  const start = factory.state();
  const accept = factory.state();
  return {
    start: start.id,
    accept: accept.id,
    states: [start, accept, ...fragment.states],
    transitions: [
      factory.transition(start.id, accept.id, EPSILON),
      factory.transition(start.id, fragment.start, EPSILON),
      factory.transition(fragment.accept, fragment.start, EPSILON),
      factory.transition(fragment.accept, accept.id, EPSILON),
      ...fragment.transitions
    ]
  };
}

function plus(fragment: Fragment, factory: IdFactory): Fragment {
  const start = factory.state();
  const accept = factory.state();
  return {
    start: start.id,
    accept: accept.id,
    states: [start, accept, ...fragment.states],
    transitions: [
      factory.transition(start.id, fragment.start, EPSILON),
      factory.transition(fragment.accept, fragment.start, EPSILON),
      factory.transition(fragment.accept, accept.id, EPSILON),
      ...fragment.transitions
    ]
  };
}

function optional(fragment: Fragment, factory: IdFactory): Fragment {
  const start = factory.state();
  const accept = factory.state();
  return {
    start: start.id,
    accept: accept.id,
    states: [start, accept, ...fragment.states],
    transitions: [
      factory.transition(start.id, accept.id, EPSILON),
      factory.transition(start.id, fragment.start, EPSILON),
      factory.transition(fragment.accept, accept.id, EPSILON),
      ...fragment.transitions
    ]
  };
}
