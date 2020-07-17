import Component from "@glimmer/component";
import { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";
import { Terminal } from "xterm";

const theme = {
  background: "#281f2c",
  foreground: "#ffffff",
  cursor: "#fc605b",
  cursorAccent: "#fda3a0",
  selection: "#a29faa",
  black: "#3a3a3a",
  red: "#dd948e",
  green: "#b6d1aa",
  yellow: "#f3d57c",
  blue: "#8aa9d5",
  magenta: "#cbafd5",
  cyan: "#9ad1d4",
  white: "#efefef",
  brightBlack: "#5e5d5e",
  brightRed: "#e69b94",
  brightGreen: "#d1f0c3",
  brightYellow: "#f4d799",
  brightBlue: "#a6cbfe",
  brightMagenta: "#e7c7f2",
  brightCyan: "#b0f0f5",
  brightWhite: "#ffffff"
};

export default class ProcessComponent extends Component {
  @tracked follow = true;

  constructor() {
    super(...arguments);

    // This lives on the Process component so that we can more easily
    // call terminal.clear()
    this.terminal = new Terminal({ theme });
  }

  @action clear() {
    this.terminal.clear();
  }

  @action toggleFollow() {
    this.follow = !this.follow;
  }
}
