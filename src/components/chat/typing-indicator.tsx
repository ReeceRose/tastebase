"use client";

import { ChefHat } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <Avatar className="h-8 w-8 mt-1">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <ChefHat className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col space-y-2 max-w-[85%]">
        <Card className="p-3 bg-muted border">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.15s" }}
              ></div>
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.3s" }}
              ></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                Chef Claude is preparing your culinary suggestions
              </span>
              <span className="text-base" role="img" aria-label="cooking">
                👨‍🍳
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
