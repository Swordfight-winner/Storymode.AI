const form = document.querySelector("#story-form");
const idea = document.querySelector("#idea");
const ideaCount = document.querySelector("#idea-count");
const generateButton = document.querySelector("#generate-button");
const buttonLabel = document.querySelector("#button-label");
const emptyState = document.querySelector("#empty-state");
const storyResult = document.querySelector("#story-result");
const storyText = document.querySelector("#story-text");
const loadingState = document.querySelector("#loading-state");
const loadingMessage = document.querySelector("#loading-message");
const loadingSubtitle = document.querySelector("#loading-subtitle");
const errorState = document.querySelector("#error-state");
const nextChapterButton = document.querySelector("#next-chapter-button");
const newStoryButton = document.querySelector("#new-story-button");
const continuationOptions = document.querySelector("#continuation-options");
const customDirection = document.querySelector("#custom-direction");
const chapters = [];
let storySettings = null;
let selectedContinuation = null;

idea.addEventListener("input", () => {
  ideaCount.textContent = `${idea.value.length} / 2000`;
});

function showState(state) {
  emptyState.hidden = state !== "empty";
  storyResult.hidden = state !== "story" && !(state === "error" && chapters.length > 0);
  loadingState.hidden = state !== "loading";
  errorState.hidden = state !== "error";
}

async function generateStory(isNewStory) {
  const formData = new FormData(form);
  const settings = isNewStory
    ? Object.fromEntries(formData)
    : storySettings;
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idea: settings.idea,
      genre: settings.genre,
      tone: settings.tone,
      length: settings.length,
      details: settings.details,
      chapter_number: isNewStory ? 1 : chapters.length + 1,
      previous_story: isNewStory ? "" : chapters.map((chapter) => chapter.text).join("\n\n").slice(-40000),
      continuation_direction: isNewStory
        ? ""
        : [selectedContinuation, customDirection.value.trim()].filter(Boolean).join("\n\n"),
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "The story couldn't be generated. Please try again.");
  }
  if (typeof data.story !== "string" || !data.story.trim()) {
    throw new Error("The AI returned an empty story. Please try again.");
  }
  if (!Array.isArray(data.continuation_options)
      || data.continuation_options.length !== 3
      || data.continuation_options.some((option) => typeof option !== "string" || !option.trim())) {
    throw new Error("The AI returned invalid continuation ideas. Please try again.");
  }

  if (isNewStory) {
    storySettings = settings;
    chapters.length = 0;
  }
  chapters.push({ text: data.story, continuationOptions: data.continuation_options });
  customDirection.value = "";
  selectedContinuation = null;
  renderChapters();
  renderContinuationOptions();
  showState("story");
  storyText.scrollTop = storyText.scrollHeight;
}

function renderChapters() {
  storyText.replaceChildren();
  chapters.forEach((chapter, index) => {
    const section = document.createElement("section");
    section.className = "chapter";
    const heading = document.createElement("h3");
    heading.textContent = `Chapter ${index + 1}`;
    const text = document.createElement("p");
    text.textContent = chapter.text;
    section.append(heading, text);
    storyText.append(section);
  });
}

function renderContinuationOptions() {
  continuationOptions.replaceChildren();
  chapters.at(-1).continuationOptions.forEach((option) => {
    const button = document.createElement("button");
    button.className = "continuation-option";
    button.type = "button";
    button.textContent = option;
    button.setAttribute("aria-pressed", String(selectedContinuation === option));
    if (selectedContinuation === option) button.classList.add("selected");
    button.addEventListener("click", () => {
      selectedContinuation = selectedContinuation === option ? null : option;
      renderContinuationOptions();
    });
    continuationOptions.append(button);
  });
}

async function runGeneration(isNewStory) {
  generateButton.disabled = true;
  nextChapterButton.disabled = true;
  newStoryButton.disabled = true;
  buttonLabel.textContent = isNewStory ? "Starting a new story..." : "Writing next chapter...";
  loadingMessage.textContent = isNewStory ? "Finding the first words..." : `Writing Chapter ${chapters.length + 1}...`;
  loadingSubtitle.textContent = "Keeping your characters and story in mind.";
  showState("loading");

  try {
    await generateStory(isNewStory);
  } catch (error) {
    errorState.textContent = error.message;
    showState("error");
  } finally {
    generateButton.disabled = false;
    nextChapterButton.disabled = false;
    newStoryButton.disabled = false;
    buttonLabel.textContent = chapters.length ? "Start a new story" : "Begin Chapter 1";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  await runGeneration(true);
});

nextChapterButton.addEventListener("click", () => runGeneration(false));

newStoryButton.addEventListener("click", () => {
  chapters.length = 0;
  storySettings = null;
  selectedContinuation = null;
  customDirection.value = "";
  storyText.replaceChildren();
  continuationOptions.replaceChildren();
  errorState.textContent = "";
  showState("empty");
  buttonLabel.textContent = "Begin Chapter 1";
  idea.focus();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelector("#copy-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  try {
    const fullStory = chapters
      .map((chapter, index) => `Chapter ${index + 1}\n\n${chapter.text}`)
      .join("\n\n");
    await navigator.clipboard.writeText(fullStory);
    button.textContent = "Copied!";
    window.setTimeout(() => {
      button.textContent = "Copy story";
    }, 1800);
  } catch {
    button.textContent = "Couldn't copy";
    window.setTimeout(() => {
      button.textContent = "Copy story";
    }, 1800);
  }
});
