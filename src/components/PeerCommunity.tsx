import React, { useState } from 'react';
import { INITIAL_PEER_POSTS, STRESSORS } from '../data/mockData';
import { PeerPost, StressorCategory, UserProfile } from '../types';
import { Users, Heart, MessageSquare, Send, Plus, ShieldCheck, Sparkles, Filter } from 'lucide-react';

interface PeerCommunityProps {
  userProfile: UserProfile;
  onActivityLogged: (title: string, desc: string, score?: number) => void;
}

export const PeerCommunity: React.FC<PeerCommunityProps> = ({
  userProfile,
  onActivityLogged,
}) => {
  const [posts, setPosts] = useState<PeerPost[]>(INITIAL_PEER_POSTS);
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTag, setNewTag] = useState<StressorCategory>('Exams & Deadlines');
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredPosts = selectedTag === 'All'
    ? posts
    : posts.filter((p) => p.tag === selectedTag);

  const handleCheer = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, cheers: p.cheers + 1 } : p))
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost: PeerPost = {
      id: 'p_' + Date.now(),
      authorAlias: userProfile.displayName,
      isAnonymous: true,
      avatarColor: '#4f7c6f',
      tag: newTag,
      title: newTitle.trim(),
      content: newContent.trim(),
      timestamp: 'Just now',
      university: userProfile.university || 'South African University',
      cheers: 1,
      repliesCount: 0,
      replies: [],
    };

    setPosts([newPost, ...posts]);
    setNewTitle('');
    setNewContent('');
    setIsCreatingPost(false);

    onActivityLogged('Peer Support Post', `Shared thoughts on "${newTag}"`, 65);
  };

  const handleAddReply = (postId: string) => {
    if (!replyText.trim()) return;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newReply = {
            id: 'r_' + Date.now(),
            authorAlias: userProfile.displayName,
            content: replyText.trim(),
            timestamp: 'Just now',
          };
          return {
            ...p,
            repliesCount: p.repliesCount + 1,
            replies: [...p.replies, newReply],
          };
        }
        return p;
      })
    );

    setReplyText('');
    onActivityLogged('Encouraged a Peer', 'Replied with empathy on peer board', 70);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e8e0d0] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#4f7c6f]/15 text-[#3a5d53]">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-[#1c1a16] font-sans">
              Anonymous Student Circles
            </h2>
          </div>
          <p className="text-xs text-[#5c574c] mt-1 max-w-xl leading-relaxed">
            A safe, moderated space to read how other South African university students cope with exams, NSFAS delays, res life, and family pressure.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingPost(true)}
          className="px-5 py-2.5 bg-[#212b4a] hover:bg-[#161d34] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#e8a33d]" />
          <span>Post Anonymously</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-xs font-bold text-[#8a8578] flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setSelectedTag('All')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
            selectedTag === 'All'
              ? 'bg-[#212b4a] text-white shadow-xs'
              : 'bg-white text-[#5c574c] border border-[#e8e0d0] hover:bg-[#f3eee4]'
          }`}
        >
          All Topics
        </button>
        {STRESSORS.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedTag(st)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
              selectedTag === st
                ? 'bg-[#4f7c6f] text-white shadow-xs'
                : 'bg-white text-[#5c574c] border border-[#e8e0d0] hover:bg-[#f3eee4]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* New Post Modal */}
      {isCreatingPost && (
        <div className="bg-white rounded-2xl p-6 border-2 border-[#4f7c6f] shadow-md space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1c1a16] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4f7c6f]" />
              Share an Anonymous Post (Protected as {userProfile.displayName})
            </h3>
            <button
              onClick={() => setIsCreatingPost(false)}
              className="text-xs text-[#5c574c] hover:underline"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#1c1a16] mb-1">Topic / Category</label>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value as StressorCategory)}
                className="w-full p-2.5 text-xs rounded-xl border border-[#e8e0d0] bg-[#f3eee4]"
              >
                {STRESSORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1c1a16] mb-1">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Dealing with heavy academic burnout..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-[#e8e0d0] focus:ring-2 focus:ring-[#4f7c6f]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1c1a16] mb-1">What's on your mind?</label>
              <textarea
                required
                rows={4}
                placeholder="Share your experience or ask for advice. Keep it respectful..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full p-3 text-xs rounded-xl border border-[#e8e0d0] focus:ring-2 focus:ring-[#4f7c6f]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#4f7c6f] hover:bg-[#3a5d53] text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Post to Community Anonymously
            </button>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl p-5 sm:p-6 border border-[#e8e0d0] shadow-xs space-y-3"
          >
            {/* Post Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold font-mono"
                  style={{ backgroundColor: post.avatarColor || '#4f7c6f' }}
                >
                  {post.authorAlias.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1c1a16]">{post.authorAlias}</div>
                  <div className="text-[10px] text-[#8a8578]">
                    {post.university} · {post.timestamp}
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 bg-[#f3eee4] text-[#5c574c] rounded-full text-[11px] font-semibold">
                {post.tag}
              </span>
            </div>

            {/* Post Body */}
            <div>
              <h4 className="text-sm font-bold text-[#1c1a16]">{post.title}</h4>
              <p className="text-xs sm:text-sm text-[#5c574c] mt-1.5 leading-relaxed">
                {post.content}
              </p>
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#f3eee4]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCheer(post.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f3eee4] hover:bg-[#e8a33d]/20 text-[#1c1a16] text-xs font-semibold transition-colors"
                >
                  <Heart className="w-3.5 h-3.5 text-[#c3503b]" />
                  <span>Send Strength ({post.cheers})</span>
                </button>

                <button
                  onClick={() =>
                    setExpandedPostId(expandedPostId === post.id ? null : post.id)
                  }
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-[#f3eee4] text-[#5c574c] text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Replies ({post.repliesCount})</span>
                </button>
              </div>
            </div>

            {/* Replies Drawer */}
            {expandedPostId === post.id && (
              <div className="pt-3 mt-3 border-t border-[#f3eee4] space-y-3">
                <div className="space-y-2">
                  {post.replies.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 bg-[#f3eee4] rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#1c1a16]">
                        <span>{rep.authorAlias}</span>
                        <span className="text-[#8a8578] font-normal">{rep.timestamp}</span>
                      </div>
                      <p className="text-[#5c574c]">{rep.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Send an anonymous word of encouragement..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddReply(post.id)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#e8e0d0] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f7c6f]"
                  />
                  <button
                    onClick={() => handleAddReply(post.id)}
                    className="p-2 bg-[#4f7c6f] hover:bg-[#3a5d53] text-white rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
