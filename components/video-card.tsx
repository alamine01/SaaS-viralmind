import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Heart, MessageCircle, Clock, Share2, PlayCircle, BarChart3 } from "lucide-react"
import Image from "next/image"

interface VideoCardProps {
  video: {
    id: string
    title: string
    thumbnail: string
    platform: 'tiktok' | 'youtube' | 'instagram'
    views: string
    likes: string
    comments: string
    duration: string
    viral_score: number
    niche: string
  }
}

export function VideoCard({ video }: VideoCardProps) {
  return (
    <Card className="group overflow-hidden border-slate-200/60 bg-white shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-2 rounded-[32px]">
      <div className="relative aspect-[9/16] overflow-hidden bg-slate-100">
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-500 group-hover:opacity-100 bg-slate-900/40 backdrop-blur-[2px] z-10">
           <div className="size-16 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
              <PlayCircle className="size-8 fill-current" />
           </div>
        </div>
        
        {/* Platform Badge */}
        <div className="absolute top-4 left-4 z-20">
           <Badge variant="secondary" className="bg-white/90 backdrop-blur-md border-none text-[9px] font-black uppercase tracking-widest text-slate-900 py-1 px-3 rounded-full">
             {video.platform === 'tiktok' ? 'TikTok' : video.platform === 'instagram' ? 'Reels' : 'YouTube'}
           </Badge>
        </div>

        {/* Viral Score Badge */}
        <div className="absolute top-4 right-4 z-20">
           <div className="flex flex-col items-center bg-blue-600 text-white p-2 rounded-2xl shadow-lg shadow-blue-600/40 border border-blue-400/30">
              <span className="text-[10px] font-black leading-none uppercase tracking-tighter">Score</span>
              <span className="text-sm font-black leading-none mt-1">{video.viral_score}%</span>
           </div>
        </div>

        {/* Placeholder Gradient if no image */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-slate-900/80"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 z-20">
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{video.niche}</p>
           <p className="text-sm font-black text-white line-clamp-2 leading-tight tracking-tight group-hover:text-blue-200 transition-colors">{video.title}</p>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <Eye className="size-3.5 text-slate-300" />
            {video.views}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <Heart className="size-3.5 text-red-400/60" />
            {video.likes}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <MessageCircle className="size-3.5 text-blue-400/60" />
            {video.comments}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
            <Clock className="size-3.5 text-slate-300" />
            {video.duration}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-2">
         <Button className="flex-1 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl h-11 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 border-none transition-all active:scale-95">
            <BarChart3 className="size-3.5 mr-2" />
            Analyser
         </Button>
         <Button variant="outline" size="icon" className="size-11 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all">
            <Share2 className="size-4 text-slate-500" />
         </Button>
      </CardFooter>
    </Card>
  )
}
