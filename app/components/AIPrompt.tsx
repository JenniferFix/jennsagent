import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import { anthropicClient, type Message } from '@/lib/anthropic';
import { createServerFn } from '@tanstack/start';

const QuestionQueryPage = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const queryClient = useQueryClient();

  const { mutate: sendMessage, isIdle } = useMutation({
    mutationFn: async (message: string) => {
      console.log('calling mutation', message);
      const response = await anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [...messages, { role: 'user', content: message }],
      });
      console.log(response);
      return response;
    },
    onSuccess: (data) => {
      const assistantMessage = data.content
        .filter((content) => content.type === 'text')
        .map((content) => content.text)
        .join('');

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: assistantMessage },
      ]);
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    sendMessage(input);
    setInput('');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[600px] flex flex-col">
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted'
              }`}
            >
              {typeof message.content === 'string' ? message.content : ''}
            </div>
          </div>
        ))}
      </ScrollArea>
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t flex gap-2 items-center"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          // disabled={!isIdle}
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
};

export default QuestionQueryPage;
