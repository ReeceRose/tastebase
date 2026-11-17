import { PhotoStrip } from "@/components/recipes/photo-strip";
import { RecipeVideoPlayer } from "@/components/recipes/recipe-video-player";
import type { RecipeSwatch, TemperatureUnit } from "@/lib/types";
import type {
  RecipeImage,
  RecipeInstruction,
  RecipeVideo,
} from "@/lib/types/recipe-types";
import { cn } from "@/lib/utils";
import { convertTemperaturesInText } from "@/lib/utils/ingredient-scaling";
import { photosForStep } from "@/lib/utils/photo-tags";
import { groupInstructionsByGroup } from "@/lib/utils/recipe-utils";
import { videosForStep } from "@/lib/utils/recipe-videos";
import { stepSwatch, swatchClasses } from "@/lib/utils/swatches";
import { formatTotalTime } from "@/lib/utils/time-formatting";
import { formatTemperatureForDisplay } from "@/lib/utils/unit-conversions";

interface InstructionStepsProps {
  instructions: RecipeInstruction[];
  images: RecipeImage[];
  videos: RecipeVideo[];
  title: string;
  swatch: RecipeSwatch;
  temperatureUnit: TemperatureUnit;
}

export function InstructionSteps({
  instructions,
  images,
  videos,
  title,
  swatch,
  temperatureUnit,
}: InstructionStepsProps) {
  if (instructions.length === 0) {
    return (
      <p className="rounded-tile bg-card p-6 text-muted-foreground">
        No steps written down yet.
      </p>
    );
  }

  const groups = Object.entries(groupInstructionsByGroup([...instructions]));
  const showGroupNames = groups.length > 1;
  let stepIndex = 0;

  return (
    <div className="space-y-6">
      {groups.map(([groupName, steps]) => (
        <div key={groupName} className="space-y-2.5">
          {showGroupNames && (
            <h3 className="text-meta text-muted-foreground">{groupName}</h3>
          )}
          <ol className="space-y-2.5">
            {steps.map((step) => {
              const index = stepIndex++;
              const disc = swatchClasses(stepSwatch(swatch, index));
              const time = formatTotalTime(step.timeMinutes);
              const temperature = step.temperature
                ? formatTemperatureForDisplay(step.temperature, temperatureUnit)
                : null;
              const stepPhotos = photosForStep(images, step.stepNumber);
              const stepVideos = videosForStep(videos, step.stepNumber);

              return (
                <li
                  key={step.id}
                  className="grid grid-cols-[44px_1fr] gap-4 rounded-tile bg-card p-4 sm:p-5"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-11 place-items-center rounded-full text-lg font-extrabold",
                      disc.bg,
                      disc.fg,
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 self-center">
                    <span className="sr-only">Step {index + 1}. </span>
                    <p className="text-lead leading-snug">
                      {convertTemperaturesInText(
                        step.instruction,
                        temperatureUnit,
                      )}
                    </p>
                    {(time || temperature || step.notes) && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-meta">
                        {time && (
                          <span className="rounded-full bg-background px-3 py-1 tabular">
                            {time}
                          </span>
                        )}
                        {temperature && (
                          <span className="rounded-full bg-background px-3 py-1 tabular">
                            {temperature}
                          </span>
                        )}
                        {step.notes && (
                          <span className="font-normal text-muted-foreground">
                            {step.notes}
                          </span>
                        )}
                      </div>
                    )}
                    {stepPhotos.length > 0 && (
                      <div className="mt-3">
                        <PhotoStrip
                          images={stepPhotos}
                          title={`${title}, step ${index + 1}`}
                          minimum={1}
                          label={`Photos for step ${index + 1}`}
                        />
                      </div>
                    )}
                    {stepVideos.length > 0 && (
                      <ul
                        className={cn(
                          "mt-3 grid gap-2.5",
                          stepVideos.length > 1 && "sm:grid-cols-2",
                        )}
                        aria-label={`Videos for step ${index + 1}`}
                      >
                        {stepVideos.map((video) => (
                          <li key={video.id}>
                            <RecipeVideoPlayer
                              src={`/api/recipes/videos/${video.filename}`}
                              title={`Step ${index + 1} video`}
                              clip
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
