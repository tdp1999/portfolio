export abstract class BaseCommand {
  readonly timestamp = new Date();
  constructor(readonly userId: string) {}
}
