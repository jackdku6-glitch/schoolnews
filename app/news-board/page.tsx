"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import FormField from '@/components/FormField';
import SubmitButton from '@/components/SubmitButton';
import ItemCard from '@/components/ItemCard';
import EmptyState from '@/components/EmptyState';
import confetti from 'canvas-confetti';

interface Post {
  id: any;
  title: string;
  content: string;
  author: string;
  image_url?: string;
  likes: number;
  created_at?: string;
}

export default function NewsBoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);

  // Формын State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchPosts();
    const savedLikes = JSON.parse(localStorage.getItem('sm_liked_posts') || '[]');
    setLikedPosts(savedLikes);
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

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !author.trim()) return alert("Бүх талбарыг бөглөнө үү!");

    setLoading(true);
    try {
      let image_url = "";
      if (imageFile) {
        const fileName = `${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('news-images')
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('news-images').getPublicUrl(fileName);
        image_url = publicUrlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('posts')
        .insert([{ title, content, author, image_url, likes: 0 }])
        .select().single();

      if (error) throw error;
      if (data) {
        setPosts([data, ...posts]);
        setTitle(''); setContent(''); setAuthor(''); setImageFile(null);
        
        // ЧИМЭГ: Амжилттай нийтлэхэд пуужин буудах
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4F46E5', '#EC4899', '#F59E0B']
        });
      }
    } catch (error: any) {
      alert("Алдаа: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id: any, currentLikes: number) => {
    const isAlreadyLiked = likedPosts.includes(id);
    const newLikesCount = isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    try {
      const { error } = await supabase.from('posts').update({ likes: newLikesCount }).eq('id', id);
      if (error) throw error;

      let newLikedPosts;
      if (isAlreadyLiked) {
        newLikedPosts = likedPosts.filter(pId => pId !== id);
      } else {
        newLikedPosts = [...likedPosts, id];
        // ЧИМЭГ: Like дарахад жижиг confetti
        confetti({ particleCount: 30, scalar: 0.7, origin: { x: Math.random(), y: 0.8 } });
      }

      setLikedPosts(newLikedPosts);
      localStorage.setItem('sm_liked_posts', JSON.stringify(newLikedPosts));
      setPosts(posts.map(p => p.id === id ? { ...p, likes: newLikesCount } : p));
    } catch (error: any) {
      console.error('Like error:', error.message);
    }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm("Мэдээг бүрэн устгах уу?")) return;
    try {
      if (post.image_url) {
        const fileName = post.image_url.split('/').pop() || "";
        await supabase.storage.from('news-images').remove([fileName]);
      }
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (error) throw error;
      setPosts(posts.filter(p => p.id !== post.id));
    } catch (error: any) {
      alert("Устгаж чадсангүй.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-[40%] h-[40%] bg-pink-100/50 rounded-full blur-[100px]"></div>
      </div>

      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="group flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transition-transform group-hover:rotate-12">SM</div>
            <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase">News Board</h1>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white border rounded-full shadow-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        <aside className="lg:col-span-4 order-2 lg:order-1">
          <section className="bg-white/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white shadow-xl sticky top-28 transition-all hover:shadow-2xl">
            <h2 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tighter italic underline decoration-indigo-500">Broadcast</h2>
            <form onSubmit={handlePostSubmit} className="space-y-5">
              <FormField label="Headline" value={title} onChange={(e: any) => setTitle(e.target.value)} />
              <FormField label="Author" value={author} onChange={(e: any) => setAuthor(e.target.value)} />
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photo</label>
                <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-100 rounded-2xl p-4 text-center hover:bg-indigo-100 transition-colors cursor-pointer relative">
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.item(0) || null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <p className="text-[10px] font-bold text-indigo-500">{imageFile ? imageFile.name : 'Click to upload image'}</p>
                </div>
              </div>
              <FormField label="Details" isTextArea value={content} onChange={(e: any) => setContent(e.target.value)} />
              <SubmitButton label="Launch Update 🚀"/>
            </form>
          </section>
        </aside>

        <div className="lg:col-span-8 order-1 lg:order-2 space-y-10">
          {fetching ? (
            <div className="text-center py-20 font-black text-slate-300 animate-pulse tracking-[0.3em]">SYNCING FEED...</div>
          ) : (
            <div className="grid grid-cols-1 gap-12">
              {posts.map((post) => (
                <div key={post.id} className="relative group transition-all duration-500 hover:-translate-y-1">
                  <button onClick={() => handleDelete(post)} className="absolute -top-3 -right-3 z-20 p-2.5 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all border border-gray-100 hover:scale-110">🗑️</button>
                  <ItemCard 
                    title={post.title}
                    description={post.content}
                    image={post.image_url}
                    footer={
                      <div className="flex justify-between items-center w-full mt-6 pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-3">
                           <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md transition-transform group-hover:scale-110">
                             {post.author.charAt(0).toUpperCase()}
                           </div>
                           <span className="text-xs font-bold text-slate-500 uppercase italic tracking-wider">By {post.author}</span>
                        </div>
                        <button 
                          onClick={() => handleLike(post.id, post.likes)}
                          className={`flex items-center gap-3 px-6 py-2.5 rounded-full font-black text-xs transition-all active:scale-90 ${
                            likedPosts.includes(post.id) 
                              ? 'bg-indigo-600 text-white shadow-lg' 
                              : 'bg-white border border-gray-200 text-slate-900 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-base">{likedPosts.includes(post.id) ? '💙' : '👍'}</span>
                          <span>{post.likes} Like</span>
                        </button>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
