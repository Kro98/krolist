import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, ThumbsUp, Reply, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArticleComment } from '@/types/article';
import { useLanguage } from '@/contexts/LanguageContext';
import { useArticleComments, useSubmitComment } from '@/hooks/useArticle';
import { formatDistanceToNow } from 'date-fns';

interface ArticleCommentsProps {
  articleId: string;
}

export const ArticleComments = ({ articleId }: ArticleCommentsProps) => {
  const { language } = useLanguage();
  const { data: comments, isLoading } = useArticleComments(articleId);
  const submitComment = useSubmitComment();
  
  const [expanded, setExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  const displayedComments = expanded ? comments : comments?.slice(0, 3);
  
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    await submitComment.mutateAsync({
      article_id: articleId,
      content: newComment,
      guest_name: guestName || undefined,
    });
    
    setNewComment('');
    setGuestName('');
  };
  
  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    
    await submitComment.mutateAsync({
      article_id: articleId,
      content: replyContent,
      guest_name: guestName || undefined,
      parent_id: parentId,
    });
    
    setReplyContent('');
    setReplyingTo(null);
  };
  
  const CommentItem = ({ comment, isReply = false }: { comment: ArticleComment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 mt-3' : 'py-4 border-b border-border/50'}`}>
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {(comment.guest_name || 'G')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-foreground">
              {comment.guest_name || (language === 'ar' ? 'زائر' : 'Guest')}
            </span>
            <span className="text-xs text-muted-foreground">
              {comment.created_at && formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">
            {comment.content}
          </p>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ThumbsUp className="w-3 h-3" />
              {comment.upvotes > 0 && comment.upvotes}
            </button>
            
            {!isReply && (
              <button 
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply className="w-3 h-3" />
                {language === 'ar' ? 'رد' : 'Reply'}
              </button>
            )}
          </div>
          
          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder={language === 'ar' ? 'اكتب ردك...' : 'Write a reply...'}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <Button 
                size="sm" 
                onClick={() => handleSubmitReply(comment.id)}
                disabled={submitComment.isPending}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Nested replies */}
          {comment.replies?.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      </div>
    </div>
  );
  
  return (
    <section className="py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          {language === 'ar' ? 'التعليقات' : 'Comments'}
          {comments && comments.length > 0 && (
            <span className="ml-2 text-muted-foreground font-normal">({comments.length})</span>
          )}
        </h2>
      </div>
      
      {/* New comment form */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <Input
          placeholder={language === 'ar' ? 'اسمك (اختياري)' : 'Your name (optional)'}
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="mb-3"
        />
        <div className="flex gap-2">
          <Textarea
            placeholder={language === 'ar' ? 'اكتب تعليقك...' : 'Write a comment...'}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button 
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || submitComment.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex gap-3 py-4 border-b border-border/50">
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-3 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <>
          <div>
            {displayedComments?.map(comment => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
          
          {comments.length > 3 && (
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'عرض أقل' : 'Show less'}
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  {language === 'ar' ? `عرض ${comments.length - 3} تعليق آخر` : `Show ${comments.length - 3} more comments`}
                </>
              )}
            </Button>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground py-8">
          {language === 'ar' ? 'كن أول من يعلق!' : 'Be the first to comment!'}
        </p>
      )}
    </section>
  );
};
