import { Queue } from 'bullmq';
import { redisConfig } from '../config/redis';

// Define the assignment generation queue
export const assignmentQueue = new Queue('assignment-generation', {
  connection: redisConfig,
});

/**
 * Adds an assignment creation task to the BullMQ queue.
 * @param assignmentId The ID of the assignment in MongoDB
 */
export const addAssignmentGenerationJob = async (assignmentId: string): Promise<void> => {
  try {
    await assignmentQueue.add('generate', { assignmentId }, {
      removeOnComplete: true,
      removeOnFail: false,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
    console.log(`Successfully added generation job to queue for assignment ID: ${assignmentId}`);
  } catch (error) {
    console.error('Failed to add job to BullMQ queue:', error);
    throw error;
  }
};
