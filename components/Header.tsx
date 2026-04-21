"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FormField from '@/components/FormField';
import SubmitButton from '@/components/SubmitButton';
import ItemCard from '@/components/ItemCard';
import EmptyState from '@/components/EmptyState';

// 1. Data Structure
interface Post {
  id: any;
  title: string;
  content: string;
  author: string;
  category: string;
  likes: number;
}

export default function NewsBoardPage() {
  // --- States ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('General');

  // 2. Fetch Data
  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts((data as Post[]) || []);
    } catch (error: any) {
      console.error('Fetch error:', error.message);
    } finally {
      setFetching(false);
    }
  }

  // 3. Submit Post
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim()) return alert("Please fill all fields.");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([{ title, content, author, category, likes: 0 }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setPosts((prev) => [data as Post, ...prev]);
        setTitle(''); setContent(''); setAuthor(''); setCategory('General');
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Like Function
  const handleLike = async (id: any, currentLikes: number) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ likes: currentLikes + 1 })
        .eq('id', id);

      if (error) throw error;
      setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    } catch (error: any) {
      console.error('Like error:', error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans">
      {/* PROFESSIONAL NEWS HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-3 py-1 font-black text-xl tracking-tighter rounded">SM</div>
            <h1 className="text-xl font-bold border-l pl-4 border-gray-200">NEWS BOARD</h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            Live Updates
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: POST FORM (Sidebar Style) */}
          <aside className="lg:col-span-4 order-1">
            <section className="bg-white border border-gray-200 p-6 rounded-lg sticky top-24">
              <h2 className="text-sm font-black uppercase tracking-widest border-b pb-4 mb-6">Create Article</h2>
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <FormField 
                  label="Headline" 
                  placeholder="Main news title"
                  value={title} 
                  onChange={(e: any) => setTitle(e.target.value)} 
                />
                <FormField 
                  label="Reporter" 
                  placeholder="Your full name"
                  value={author} 
                  onChange={(e: any) => setAuthor(e.target.value)} 
                />
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Section</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-black outline-none"
                  >
                    <option value="General">General</option>
                    <option value="Announcement">Announcement</option>
                    <option value="Event">Event</option>
                  </select>
                </div>
                <FormField 
                  label="Content" 
                  isTextArea
                  placeholder="Type the story details here..."
                  value={content} 
                  onChange={(e: any) => setContent(e.target.value)} 
                />
                <SubmitButton label="Publish Post"  />
              </form>
            </section>
          </aside>

          {/* RIGHT: NEWS FEED (Main List) */}
          <div className="lg:col-span-8 order-2 space-y-6">
            <div className="border-b-2 border-black pb-2 mb-6">
               <h3 className="text-sm font-black uppercase tracking-[0.2em]">Latest Headlines</h3>
            </div>
            
            {fetching ? (
              <div className="text-center py-20 text-gray-400 font-medium italic">Fetching latest data...</div>
            ) : posts.length === 0 ? (
              <EmptyState message="No news stories found." />
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <ItemCard 
                    key={post.id}
                    title={post.title}
                    description={post.content}
                    badge={post.category}
                    footer={
                      <div className="flex justify-between items-center w-full mt-6 pt-4 border-t border-gray-100">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-tighter">
                          By <span className="text-black uppercase">{post.author}</span> • Campus News
                        </div>
                        <button 
                          onClick={() => handleLike(post.id, post.likes)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded transition-colors group"
                        >
                          <span className="text-xs font-bold">{post.likes}</span>
                          <span className="text-red-600">❤️</span>
                        </button>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

