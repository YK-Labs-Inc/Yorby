from dotenv import load_dotenv
import json
from livekit import agents
from livekit.agents import AgentSession, Agent, ChatContext, RoomInputOptions
from livekit.plugins import (
    openai,
    noise_cancellation,
    silero,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

class InterviewAssistant(Agent):
    def __init__(self, chat_ctx: ChatContext, interview_prompt: str) -> None:
        super().__init__(instructions=interview_prompt)


async def entrypoint(ctx: agents.JobContext):
    metadata = json.loads(ctx.job.metadata)
    print("hey metadata", metadata)
    candidate_name = metadata["candidate_name"]
    interview_prompt = metadata["interview_prompt"]

    session = AgentSession(
        stt=openai.STT(model="gpt-4o-mini-transcribe"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=openai.TTS(model="gpt-4o-mini-tts", instructions="Speak in a annoyed, new york accent who sounds impatient."),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    initial_ctx = ChatContext()
    initial_ctx.add_message(role="assistant", content=f"The interviewee's name is {candidate_name}.")

    await session.start(
        room=ctx.room,
        agent=InterviewAssistant(initial_ctx, interview_prompt),
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation
            # - If self-hosting, omit this parameter
            # - For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(), 
        ),
    )

    await ctx.connect()

    await session.generate_reply(
        instructions="Greet the user by their name and begin the interview. Begin your interview by asking the user to introduce themselves.",
        allow_interruptions=False
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(agent_name="interview_assistant", entrypoint_fnc=entrypoint))