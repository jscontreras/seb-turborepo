"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Slider } from "@repo/ui/components/ui/slider";
import { Badge } from "@repo/ui/components/ui/badge";
import { Play, Pause, Square, RotateCcw } from "lucide-react";

type ExerciseType = {
  name: string;
  rpm: number;
  handles: boolean;
  intensity: "high" | "low";
};

const exercises: ExerciseType[] = [
  {
    name: "High Intensity - No Handles",
    rpm: 160,
    handles: false,
    intensity: "high",
  },
  {
    name: "High Intensity - With Handles",
    rpm: 140,
    handles: true,
    intensity: "high",
  },
  {
    name: "Low Intensity - No Handles",
    rpm: 140,
    handles: false,
    intensity: "low",
  },
  {
    name: "Low Intensity - With Handles",
    rpm: 110,
    handles: true,
    intensity: "low",
  },
];

export default function EllipticalApp() {
  const [selectedTime, setSelectedTime] = useState(20); // in minutes
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [currentExercise, setCurrentExercise] = useState<ExerciseType | null>(
    null,
  );
  const [exerciseTimeRemaining, setExerciseTimeRemaining] = useState(45); // 45 seconds per exercise
  const [routine, setRoutine] = useState<ExerciseType[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

  // Generate random routine
  const generateRoutine = useCallback((totalMinutes: number) => {
    const totalSeconds = totalMinutes * 60;
    const exercisesNeeded = Math.floor(totalSeconds / 45); // 45 seconds per exercise
    const newRoutine: ExerciseType[] = [];

    // Start with low intensity
    let useHighIntensity = false;

    for (let i = 0; i < exercisesNeeded; i++) {
      const intensityExercises = exercises.filter((ex) =>
        useHighIntensity ? ex.intensity === "high" : ex.intensity === "low",
      );
      const randomExercise =
        intensityExercises[
          Math.floor(Math.random() * intensityExercises.length)
        ];
      newRoutine.push(randomExercise);

      // Alternate intensity every 2-3 exercises
      if (i > 0 && i % (Math.floor(Math.random() * 2) + 2) === 0) {
        useHighIntensity = !useHighIntensity;
      }
    }

    return newRoutine;
  }, []);

  // Start workout
  const startWorkout = () => {
    const newRoutine = generateRoutine(selectedTime);
    setRoutine(newRoutine);
    setTimeRemaining(selectedTime * 60);
    setCurrentExerciseIndex(0);
    setCurrentExercise(newRoutine[0]);
    setExerciseTimeRemaining(45);
    setIsRunning(true);
  };

  // Pause/Resume
  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  // Stop workout
  const stopWorkout = () => {
    setIsRunning(false);
    setTimeRemaining(0);
    setCurrentExercise(null);
    setExerciseTimeRemaining(45);
    setRoutine([]);
    setCurrentExerciseIndex(0);
  };

  // Reset to setup
  const resetToSetup = () => {
    setTimeRemaining(selectedTime * 60);
    setCurrentExercise(exercises[0]);
    setExerciseTimeRemaining(45);
    setCurrentExerciseIndex(0);
  };

  // Timer effect
  useEffect(() => {
    if (!isRunning || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });

      setExerciseTimeRemaining((prev) => {
        if (prev <= 1) {
          // Move to next exercise
          setCurrentExerciseIndex((prevIndex) => {
            const nextIndex = prevIndex + 1;
            if (nextIndex < routine.length) {
              setCurrentExercise(routine[nextIndex]);
              return nextIndex;
            }
            return prevIndex;
          });
          return 45; // Reset to 45 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, routine]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate progress
  const totalProgress =
    selectedTime * 60 > 0
      ? ((selectedTime * 60 - timeRemaining) / (selectedTime * 60)) * 100
      : 0;
  const exerciseProgress = ((45 - exerciseTimeRemaining) / 45) * 100;

  if (currentExercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Main Timer */}
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="relative w-48 h-48 mx-auto mb-4">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - totalProgress / 100)}`}
                    className="text-green-500 transition-all duration-1000 ease-linear"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-foreground">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Time
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Exercise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Current Exercise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {currentExercise.name}
                </h3>
                <div className="flex justify-center gap-2 mb-4">
                  <Badge
                    variant={
                      currentExercise.intensity === "high"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {currentExercise.intensity.toUpperCase()} INTENSITY
                  </Badge>
                  <Badge variant="outline">{currentExercise.rpm} RPM</Badge>
                  <Badge variant="outline">
                    {currentExercise.handles ? "With Handles" : "No Handles"}
                  </Badge>
                </div>
              </div>

              {/* Exercise Timer */}
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground mb-2">
                  {exerciseTimeRemaining}s
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${exerciseProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  Exercise {currentExerciseIndex + 1} of {routine.length}
                </span>
                <span>{Math.round(totalProgress)}% Complete</span>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            <Button onClick={togglePause} size="lg" className="flex-1">
              {isRunning ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isRunning ? "Pause" : "Resume"}
            </Button>
            <Button onClick={stopWorkout} variant="destructive" size="lg">
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
            <Button onClick={resetToSetup} variant="outline" size="lg">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Elliptical Workout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Time Selection */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Workout Duration</h3>
                <div className="text-3xl font-bold text-primary">
                  {selectedTime} minutes
                </div>
              </div>

              <Slider
                value={[selectedTime]}
                onValueChange={(value) => setSelectedTime(value[0])}
                min={10}
                max={60}
                step={5}
                className="w-full"
              />

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>10 min</span>
                <span>60 min</span>
              </div>
            </div>

            {/* Quick Time Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 30, 45].map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}m
                </Button>
              ))}
            </div>

            {/* Exercise Types Info */}
            <div className="space-y-3">
              <h4 className="font-semibold text-center">Exercise Types</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-muted rounded-lg"
                  >
                    <span className="font-medium">{exercise.name}</span>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          exercise.intensity === "high"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {exercise.rpm} RPM
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <Button onClick={startWorkout} size="lg" className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Start Workout
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Each exercise lasts 45 seconds</p>
              <p>• Routine starts with low intensity</p>
              <p>• Alternates between high and low intensity</p>
              <p>• Random exercise selection within intensity levels</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
