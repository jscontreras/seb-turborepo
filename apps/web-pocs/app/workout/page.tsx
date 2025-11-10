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
import { Checkbox } from "@repo/ui/components/ui/checkbox";
import { Label } from "@repo/ui/components/ui/label";
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
    name: "High Intensity - With Handles (backwards)",
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
    name: "Low Intensity - No Handles (backwards)",
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

const exerciseDuration = 45;

export default function EllipticalApp() {
  const [selectedTime, setSelectedTime] = useState(20); // in minutes
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
  const [currentExercise, setCurrentExercise] = useState<ExerciseType | null>(
    null,
  );
  const [exerciseTimeRemaining, setExerciseTimeRemaining] = useState(exerciseDuration); // 45 seconds per exercise
  const [routine, setRoutine] = useState<ExerciseType[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedExercises, setSelectedExercises] = useState<string[]>(
    exercises.map((e) => e.name),
  );

  // Generate random routine
  const generateRoutine = useCallback(
    (totalMinutes: number) => {
      const availableExercises = exercises.filter((e) =>
        selectedExercises.includes(e.name),
      );
      if (availableExercises.length === 0) {
        // Handle case where no exercises are selected, maybe alert user or use all as default
        return [];
      }
      const totalSeconds = totalMinutes * 60;
      const exercisesNeeded = Math.floor(totalSeconds / 45); // 45 seconds per exercise
      const newRoutine: ExerciseType[] = [];

      // Start with low intensity
      let useHighIntensity = false;
      let previousExercise: ExerciseType | null = null;
      for (let i = 0; i < exercisesNeeded; i++) {
        const intensityExercises = availableExercises.filter((ex) =>
          useHighIntensity ? ex.intensity === "high" : ex.intensity === "low",
        );

        // Filter out the previous exercise to avoid consecutive duplicates
        const availableForSelection = intensityExercises.filter((ex) =>
          !previousExercise || ex.name !== previousExercise.name
        );

        let selectedExercise: ExerciseType;

        if (availableForSelection.length === 0) {
          // If no exercises available after filtering, try switching intensity
          useHighIntensity = !useHighIntensity;
          const fallbackIntensityExercises = availableExercises.filter((ex) =>
            useHighIntensity ? ex.intensity === "high" : ex.intensity === "low",
          );
          const fallbackAvailable = fallbackIntensityExercises.filter((ex) =>
            !previousExercise || ex.name !== previousExercise.name
          );

          if (fallbackAvailable.length === 0) {
            // If still no exercises available, use any exercise from the current intensity
            if (intensityExercises.length === 0) continue;
            selectedExercise = intensityExercises[Math.floor(Math.random() * intensityExercises.length)]!;
          } else {
            selectedExercise = fallbackAvailable[Math.floor(Math.random() * fallbackAvailable.length)]!;
          }
        } else {
          selectedExercise = availableForSelection[Math.floor(Math.random() * availableForSelection.length)]!;
        }

        newRoutine.push(selectedExercise);
        previousExercise = selectedExercise;

        // Alternate intensity every exercise (1 and 1)
        useHighIntensity = !useHighIntensity;
      }

      return newRoutine;
    },
    [selectedExercises],
  );

  // Start workout
  const startWorkout = () => {
    const newRoutine = generateRoutine(selectedTime);
    setRoutine(newRoutine);
    setTimeRemaining(selectedTime * 60);
    setCurrentExerciseIndex(0);
    setCurrentExercise(newRoutine[0] || null);
    setExerciseTimeRemaining(exerciseDuration);
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
    setExerciseTimeRemaining(exerciseDuration);
    setRoutine([]);
    setCurrentExerciseIndex(0);
  };

  // Reset to setup
  const resetToSetup = () => {
    stopWorkout();
  };

  const toggleExerciseSelection = (exerciseName: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exerciseName)
        ? prev.filter((name) => name !== exerciseName)
        : [...prev, exerciseName],
    );
  };

  // Timer effect
  useEffect(() => {
    document.getElementById("version-popup")?.remove();
    document.querySelector("header")?.remove();
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
              setCurrentExercise(routine[nextIndex] || null);
              return nextIndex;
            }
            return prevIndex;
          });
          return exerciseDuration; // Reset to 45 seconds
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
  const calculatedProgress = ((exerciseDuration - exerciseTimeRemaining) / exerciseDuration) * 100;
  const exerciseProgress = calculatedProgress;

  // Calculate if current exercise is the last one
  const isLastExercise = currentExerciseIndex >= routine.length - 1;

  // Get the next exercise
  const nextExercise = currentExerciseIndex + 1 < routine.length
    ? routine[currentExerciseIndex + 1]
    : null;

  if (currentExercise) {
    return (
      <div className="max-sm:p-0 min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 md:p-4">
        <div className="max-w-md mx-auto md:space-y-6 sm:p-0">
          {/* Main Timer */}
          <Card className="text-center mt-2">
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
              <CardTitle className="text-center">
                <span className={isLastExercise ? "text-green-600 dark:text-green-400" : "text-foreground"}>
                  {isLastExercise ? (
                    <>
                      Routine Completed! <span className="text-2xl">🎉</span>
                    </>
                  ) : (
                    "Next Exercise: " + (nextExercise?.name || "No More Exercises")
                  )}
                </span>
              </CardTitle>
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
                <div className={`text-2xl font-bold mb-2 ${isLastExercise ? 'text-gray-400 dark:text-gray-500' : 'text-foreground'}`}>
                  {isLastExercise ? 'Well Done!' : exerciseTimeRemaining + 's'}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${isLastExercise ? 'bg-gray-400 dark:bg-gray-500' : 'bg-blue-500 transition-all duration-1000 ease-linear'}`}
                    style={{ width: `${isLastExercise ? 100 : exerciseProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Info */}
          <Card className="mb-2">
            <CardContent className="pt-1">
              <div className={`flex justify-between text-sm ${isLastExercise ? 'text-gray-400 dark:text-gray-500' : 'text-muted-foreground'}`}>
                <span>
                  Exercise {currentExerciseIndex + 1} of {routine.length}
                </span>
                <span>{isLastExercise ? '100' : Math.round(totalProgress)}% Complete</span>
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="flex gap-2 justify-center flex-align-center">
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
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 md:p-4">
      <div className="max-w-md mx-auto space-y-6 p-0 md:p-0">
        <Card className="border-0 md:border rounded-none md:rounded-lg" id="workout-card">
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
                onValueChange={(value) => setSelectedTime(value[0] || 20)}
                min={20}
                max={80}
                step={20}
                className="w-full"
              />

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>20 min</span>
                <span>80 min</span>
              </div>
            </div>

            {/* Quick Time Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[20, 30, 60, 80].map((time) => (
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
                  <Label
                    key={index}
                    htmlFor={`ex-${index}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted cursor-pointer hover:bg-muted/90"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`ex-${index}`}
                        checked={selectedExercises.includes(exercise.name)}
                        onCheckedChange={() =>
                          toggleExerciseSelection(exercise.name)
                        }
                      />
                      <span className="font-medium">{exercise.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          exercise.intensity === "high"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs pointer-events-none"
                      >
                        {exercise.intensity}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs pointer-events-none"
                      >
                        {exercise.rpm} RPM
                      </Badge>
                    </div>
                  </Label>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={startWorkout}
              size="lg"
              className="w-full !mt-0 pt-0"
              disabled={selectedExercises.length === 0}
            >
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
