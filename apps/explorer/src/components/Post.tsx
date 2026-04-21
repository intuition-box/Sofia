import { useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Heart, MessageCircle, Share, MoreHorizontal, Play } from "lucide-react";
import { Card } from "./ui/card";

interface PostData {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: {
    type: 'photo' | 'video';
    url: string;
  };
  space: string;
  timestamp: string;
  likes: number;
  hamstrings: number; // reply count
  isLiked: boolean;
  description?: string;
  chain?: PostData[]; // hamstring chain
}

interface PostProps {
  post: PostData;
  onLike: (postId: string) => void;
  onHamstring: (postId: string) => void;
  showChain?: boolean;
}

export function Post({ post, onLike, onHamstring, showChain = true }: PostProps) {
  const [showFullChain, setShowFullChain] = useState(false);

  const spaceEmojis: Record<string, string> = {
    shoes: '👟',
    food: '🍕',
    travel: '✈️',
    fitness: '💪',
    music: '🎵',
    art: '🎨',
    tech: '📱',
    all: '🌟'
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* Post header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>{post.author.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.author.name}</p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>{post.timestamp}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {spaceEmojis[post.space]} {post.space}
            </Badge>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Post description */}
        {post.description && (
          <p className="mb-3 text-sm">{post.description}</p>
        )}
      </div>

      {/* Post content */}
      <div className="relative aspect-[4/5] bg-muted">
        {post.content.type === 'photo' ? (
          <img 
            src={post.content.url} 
            alt="Post content" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
            <img 
              src={post.content.url} 
              alt="Video thumbnail" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Button size="lg" className="rounded-full bg-black/70 hover:bg-black/80">
                <Play className="h-6 w-6 text-white" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Post actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post.id)}
              className={post.isLiked ? "text-red-500" : ""}
            >
              <Heart className={`h-5 w-5 mr-1 ${post.isLiked ? 'fill-current' : ''}`} />
              {post.likes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onHamstring(post.id)}
            >
              <MessageCircle className="h-5 w-5 mr-1" />
              {post.hamstrings}
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Hamstring chain preview */}
        {showChain && post.chain && post.chain.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Hamstring chain ({post.chain.length} replies)
              </p>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowFullChain(!showFullChain)}
              >
                {showFullChain ? 'Hide' : 'Show all'}
              </Button>
            </div>
            
            <div className="space-y-2 pl-4 border-l-2 border-muted">
              {(showFullChain ? post.chain : post.chain.slice(0, 2)).map((chainPost) => (
                <Post 
                  key={chainPost.id} 
                  post={chainPost} 
                  onLike={onLike} 
                  onHamstring={onHamstring}
                  showChain={false}
                />
              ))}
              
              {!showFullChain && post.chain.length > 2 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground"
                  onClick={() => setShowFullChain(true)}
                >
                  Show {post.chain.length - 2} more replies...
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}