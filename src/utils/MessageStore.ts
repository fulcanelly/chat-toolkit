import EventEmitter from 'events';
import { Message } from 'telegraf/typings/core/types/typegram';


export type MsgWithText = Message & { text?: string | undefined }


export class MessageStoreCancelationError extends Error { }

export class MessageStore<M> {
  messages: { [k: number]: M[]; } = {};

  producer = new EventEmitter
  cancellator = new EventEmitter

  cancellRejector: undefined | ((reason?: any) => void)

  addMessage(user_id: number, msg: M) {
    if (!this.messages[user_id]) {
      this.messages[user_id] = [];
    }
    this.messages[user_id].push(msg);
    this.producer.emit(user_id.toString(), msg);
  }

  cancell(user_id: number) {
    this.cancellator.emit(user_id.toString());
    delete this.messages[user_id]
  }

  async getMessage(user_id: number): Promise<M> {
    const messageEvent = user_id.toString();

    if (this.messages[user_id] && this.messages[user_id].length > 0) {
      return this.messages[user_id].shift()!;
    }

    return await new Promise((resolve, reject) => {

      const onMessage = () => {
        console.log({ user_id,  getMessage: 'onMessage'})
        this.cancellator.removeListener(messageEvent, onCancel);
        resolve(this.messages[user_id].shift()!);
      };

      const onCancel = () => {
        console.log({ user_id,  getMessage: 'onCancel'})
        this.producer.removeListener(messageEvent, onMessage);
        reject(new MessageStoreCancelationError());
      };

      this.producer.once(messageEvent, onMessage);
      this.cancellator.once(messageEvent, onCancel);
    });

  }
}
