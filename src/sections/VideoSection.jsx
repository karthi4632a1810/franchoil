import React, { useCallback, useEffect, useState } from 'react'
import "../css/banner.css"
import { useAnimation } from '../hooks/useAnimation';
import RTDBTest from '../components/RTDBTest';
import { useRTDB } from '../hooks/useRealtimeDatabase';

function VideoSection() {
  const { value, loading, error } = useRTDB("/public/videos");
  const videos = Array.isArray(value) ? value : [];
  const [elements, setElements] = useState([]);
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/embed/jB3KL-Gr8iU");
  const refCallback = useCallback((el) => {
    if (el && !elements.includes(el)) {
      setElements((prev) => [...prev, el]);
    }
  }, [elements]);
  useAnimation(elements);
  const [videoSrc, setVedioSrc] = useState('franch_oil_1')

  useEffect(() => {
    if (loading) return;
    const selectedVideo = videos.find((v) => v?.code === videoSrc);
    if (selectedVideo?.url) {
      setVideoUrl(selectedVideo.url);
    } else {
      setVideoUrl("https://www.youtube.com/embed/jB3KL-Gr8iU");
    }
  }, [videoSrc, loading, videos]);

  const videoSrcArr = {
    "franch_oil_1": "https://www.youtube.com/embed/jB3KL-Gr8iU",
    "franch_oil_2": "https://www.youtube.com/embed/u1iOWT9Uj7c",
    "omega_3": "https://www.youtube.com/embed/GIhk-jP5Uv4"
  }
  return (
    <section className='max-w-[1200px] w-[90%] mx-auto mb-5 mt-15'>
      <h1 className='text-center text-green-700 text-3xl mb-10 font-bold'>Videos</h1>
      <div className="flex justify-center items-center gap-5">
        {!loading && videos.map((v, i) => (
          <div key={v + i} className={`video-player-btn-wrapper  flex justify-center items-center active `}>
            <div title={v.name} onClick={() => { setVedioSrc(v.code) }} className='play-btn-img'></div>
          </div>
        ))}

      </div>
      <iframe
        data-animation="up"
        ref={refCallback}
        className="w-full aspect-video mt-10 rounded-xl"
        src={`${videoUrl.split("/embed/")[0]}/embed/?autoplay=1&loop=1&playlist=${videoUrl.split("/embed/")[1]}&rel=0&modestbranding=1`}
        allow="autoplay; encrypted-media"
        allowFullScreen
      ></iframe>
    </section >
  )
}

export default VideoSection
