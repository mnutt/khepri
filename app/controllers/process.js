import Controller from "@ember/controller";

export default Controller.extend({
  follow: true,

  actions: {
    clear() {
      this.set("model.data", []);
    },

    toggleFollow() {
      this.toggleProperty("follow");
    },

    fireCommand() {
      this.send("fireCommandToProcess", this.model.command);
      this.set("model.command", null);
    }
  }
});
