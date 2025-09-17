// Tool execution logic for AI service
import { mapTools } from '../tools/mapTools';

export class ToolExecutor {
  // Execute missing tools manually when AI SDK doesn't execute them
  static async executeMissingTools(
    toolCalls: any[],
    toolResults: any[],
    aiMessages: any[]
  ): Promise<any[]> {
    if (toolCalls.length === 0 || toolResults.length >= toolCalls.length) {
      return toolResults;
    }

    console.log(
      `Tools called but not all executed - ${toolCalls.length} calls, ${toolResults.length} results. Executing missing ones manually...`
    );

    // Find which tools were already executed
    const executedToolNames = new Set(
      toolResults.map(result => result.toolName)
    );
    const missingToolCalls = toolCalls.filter(
      call => !executedToolNames.has(call.toolName)
    );

    console.log(
      'Missing tool calls to execute:',
      missingToolCalls.map(call => call.toolName)
    );

    for (const toolCall of missingToolCalls) {
      try {
        console.log(
          'Executing missing tool manually:',
          toolCall.toolName,
          toolCall.input
        );
        const tool = mapTools[toolCall.toolName as keyof typeof mapTools];
        if (tool && tool.execute) {
          const toolResult = await tool.execute(toolCall.input || {}, {
            toolCallId: toolCall.toolCallId || 'manual',
            messages: aiMessages,
          });
          toolResults.push({
            toolName: toolCall.toolName,
            output: toolResult,
          });
          console.log('Missing tool execution result:', toolResult);
        } else {
          console.error('Tool not found:', toolCall.toolName);
          toolResults.push({
            toolName: toolCall.toolName,
            output: {
              success: false,
              message: 'Tool not found',
              error: 'Unknown tool',
            },
          });
        }
      } catch (error) {
        console.error('Error executing missing tool:', error);
        console.error('Error details:', error);
        toolResults.push({
          toolName: toolCall.toolName,
          output: {
            success: false,
            message: 'Tool execution failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    console.log('Manual tool execution completed. Results:', toolResults);
    return toolResults;
  }
}
