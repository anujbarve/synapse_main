import { useRef, useEffect, useState } from "react";
import {
    Participant,
    Track,
    TrackPublication,
    RemoteTrack,
    RemoteTrackPublication,
    ParticipantEvent
} from "livekit-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Mic, MicOff, ScreenShare } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface VideoTileProps {
    participant: Participant;
    className?: string;
    showMuteIndicator?: boolean;
}

export function VideoTile({
    participant,
    className,
    showMuteIndicator = true,
}: VideoTileProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    const [isSpeaking, setIsSpeaking] = useState(participant.isSpeaking);
    const [microphoneMuted, setMicrophoneMuted] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // --- Track Handling and State Updates (Keep this section as it is) ---
    useEffect(() => {
        const handleTrackSubscribed = (track: RemoteTrack, publication: RemoteTrackPublication) => {
            if (track.kind === Track.Kind.Video) {
                if (publication.source === Track.Source.Camera && videoRef.current) {
                    track.attach(videoRef.current);
                    setCameraEnabled(true);
                } else if (publication.source === Track.Source.ScreenShare) {
                    setIsScreenSharing(true);
                }
            } else if (track.kind === Track.Kind.Audio) {
                if (publication.source === Track.Source.Microphone && audioRef.current) {
                    audioRef.current.muted = false;
                    track.attach(audioRef.current);
                }
            }
            if (publication.source === Track.Source.Microphone) {
                setMicrophoneMuted(publication.isMuted);
            }
        };

        const handleTrackUnsubscribed = (track: RemoteTrack, publication: RemoteTrackPublication) => {
            track.detach();
            if (publication.source === Track.Source.Camera) {
                setCameraEnabled(false);
            } else if (publication.source === Track.Source.ScreenShare) {
                setIsScreenSharing(false);
            } else if (publication.source === Track.Source.Microphone) {
                setMicrophoneMuted(false);
            }
        };

        const handleTrackMuted = (publication: TrackPublication) => {
            if (publication.source === Track.Source.Microphone) setMicrophoneMuted(true);
            if (publication.source === Track.Source.Camera) setCameraEnabled(false);
            if (publication.source === Track.Source.ScreenShare) setIsScreenSharing(false);
        };

        const handleTrackUnmuted = (publication: TrackPublication) => {
            if (publication.source === Track.Source.Microphone) setMicrophoneMuted(false);
            if (publication.source === Track.Source.Camera && publication.track && videoRef.current) {
                publication.track.attach(videoRef.current);
                setCameraEnabled(true);
            }
            if (publication.source === Track.Source.ScreenShare) setIsScreenSharing(!!publication.track);
        };

        const handleIsSpeakingChanged = (speaking: boolean) => {
            setIsSpeaking(speaking);
        };

        participant.trackPublications.forEach((publication) => {
            if (publication.track && publication.isSubscribed) {
                handleTrackSubscribed(publication.track as RemoteTrack, publication as RemoteTrackPublication);
            } else if (participant.isLocal && publication.track) {
                if (publication.source === Track.Source.Camera && videoRef.current) {
                    publication.track.attach(videoRef.current);
                    setCameraEnabled(!publication.isMuted);
                }
                if (publication.source === Track.Source.ScreenShare) {
                    setIsScreenSharing(!publication.isMuted);
                }
            }
            if (publication.source === Track.Source.Microphone) {
                setMicrophoneMuted(publication.isMuted);
            }
        });

        participant.on(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
        participant.on(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
        participant.on(ParticipantEvent.TrackMuted, handleTrackMuted);
        participant.on(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);
        participant.on(ParticipantEvent.IsSpeakingChanged, handleIsSpeakingChanged);
        participant.on(ParticipantEvent.TrackPublished, (pub) => {
            if (pub.source === Track.Source.Microphone) setMicrophoneMuted(pub.isMuted);
            if (pub.source === Track.Source.Camera) setCameraEnabled(!pub.isMuted && !!pub.track);
            if (pub.source === Track.Source.ScreenShare) setIsScreenSharing(!pub.isMuted && !!pub.track);
        });
        participant.on(ParticipantEvent.TrackUnpublished, (pub) => {
            if (pub.source === Track.Source.Microphone) setMicrophoneMuted(false);
            if (pub.source === Track.Source.Camera) setCameraEnabled(false);
            if (pub.source === Track.Source.ScreenShare) setIsScreenSharing(false);
        });

        return () => {
            participant.trackPublications.forEach((publication) => {
                if (publication.track) {
                    publication.track.detach();
                }
            });
            participant.off(ParticipantEvent.TrackSubscribed, handleTrackSubscribed);
            participant.off(ParticipantEvent.TrackUnsubscribed, handleTrackUnsubscribed);
            participant.off(ParticipantEvent.TrackMuted, handleTrackMuted);
            participant.off(ParticipantEvent.TrackUnmuted, handleTrackUnmuted);
            participant.off(ParticipantEvent.IsSpeakingChanged, handleIsSpeakingChanged);
            setCameraEnabled(false);
            setIsScreenSharing(false);
            setMicrophoneMuted(false);
            setIsSpeaking(false);
        };
    }, [participant]);

    useEffect(() => {
        if (cameraEnabled && videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(e => console.warn(`Video play failed for ${participant.identity}:`, e));
        }
    }, [cameraEnabled, participant.identity]);

    return (
        <div
            className={cn(
                "relative rounded-md overflow-hidden bg-muted", // Removed Card, added bg-muted directly
                isSpeaking ? "ring-2 ring-primary ring-offset-2" : "",
                className
            )}
        >
            <div className="relative aspect-video">
                {/* Video Element */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={participant.isLocal}
                    className={cn(
                        "w-full h-full object-cover transition-opacity duration-200",
                        !cameraEnabled && "opacity-0"
                    )}
                    style={{ visibility: !cameraEnabled ? 'hidden' : 'visible' }}
                />

                {/* Fallback Avatar */}
                {!cameraEnabled && (
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-muted">
                        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                            <AvatarFallback>
                                {participant.identity?.slice(0, 2).toUpperCase() || "???"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                )}

                {/* Audio Element (only for remote participants) */}
                {!participant.isLocal && (
                    <audio ref={audioRef} autoPlay playsInline />
                )}

                {/* Overlay with Participant Info and Icons */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-2 text-white flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium truncate shrink min-w-0">
                        {participant.identity} {participant.isLocal && <span className="text-primary">(You)</span>}
                    </span>

                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                        {isScreenSharing && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <ScreenShare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                                    </TooltipTrigger>
                                    <TooltipContent><p>Screen Sharing</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {showMuteIndicator && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        {microphoneMuted ? (
                                            <MicOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                                        ) : (
                                            <Mic className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                                        )}
                                    </TooltipTrigger>
                                    <TooltipContent><p>{microphoneMuted ? "Muted" : "Unmuted"}</p></TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}

                        {isSpeaking && !cameraEnabled && (
                            <span className="animate-pulse text-primary text-xs sm:text-sm">(Speaking)</span>
                        )}
                    </div>
                </div>

                {/* Consistent Speaking Indicator */}
                {isSpeaking && cameraEnabled && (
                    <div className="absolute inset-0 border-2 border-primary pointer-events-none rounded-md" />
                )}
                {isSpeaking && !cameraEnabled && (
                    <div className="absolute inset-0 bg-primary/10 pointer-events-none rounded-md" />
                )}
            </div>
        </div>
    );
}