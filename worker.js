const amqp = require("amqplib");

async function startWorker() {
  try {
    const connection = await amqp.connect("amqp://admin:admin123@rabbitmq.default.svc.cluster.local:5672");
    const channel = await connection.createChannel();

    const queue = "jobs";

    await channel.assertQueue(queue, { durable: true });

    console.log("Worker started, waiting for messages...");

    channel.consume(queue, (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());

        console.log("Received job:", data);

        setTimeout(() => {
          console.log("Job processed:", data.task);
          channel.ack(msg);
        }, 1000);
      }
    });
  } catch (error) {
    console.error("Worker error:", error.message);
    process.exit(1);
  }
}

startWorker();
