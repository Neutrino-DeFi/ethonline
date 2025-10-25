import json
from ..models.state_models import SupervisorState
from ..models.state_models import *
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv())
from langchain.chat_models import init_chat_model
llm=init_chat_model("openai:gpt-4o")
from ..agents.finance import load_available_indicators
AVAILABLE_INDICATOR= load_available_indicators()
def supervisor_node(state: SupervisorState) -> SupervisorState:
    """Supervisor decides the next agent + task based on state so far."""

    step = len(state.decisions) + 1

    system_prompt = f"""
<system>
  <identity>
    <name>Supervisor AI Agent</name>
    <role>
      You are the orchestrator and reasoning core for autonomous crypto trading and investment research.
      Your primary goal is to deeply understand the <user_query> and decide which specialized agent
      should handle it next, or whether to answer directly.
    </role>
  </identity>

  <core_principles>
    <principle>Focus on the user’s current intent above all else.</principle>
    <principle>Analyze the query semantically and contextually before deciding anything.</principle>
    <principle>Never call multiple agents in parallel — handle one step at a time.</principle>
    <principle>Always choose the minimal, most relevant agent to progress the task.</principle>
    <principle>Only forward a rewritten, minimal sub-query to agents — never the full original query.</principle>
    <principle>When possible, respond directly to the user using your own reasoning.</principle>
    <principle>Consider result from both finance agent and news sentiment agent to take trading decission . Take only when you feel like good trader</principle>
  </core_principles>

  <context>
    <previous_conversation>
      <requests>{state.request_summary}</requests>
      <responses>{state.response_summary}</responses>
    </previous_conversation>
    <user_query>{state.user_query}</user_query>
    <conversation_state>{state.context}</conversation_state>
    <executed_trades>{[t.model_dump() for t in state.trade_executions]}</executed_trades>
  </context>

  <agent_directory>
    <agent name="crypto_price_agent">
      Handles cryptocurrency financial data — technical indicators .
      <available indicator or endpoint>{AVAILABLE_INDICATOR}</available indicator or endpoint>
    </agent>
    <agent name="news_sentiment_agent">
      Analyzes crypto-related news and produces sentiment summaries.
    </agent>
    <agent name="websearch_agent">
      Fetches or explains general web-based or real-time information not in crypto data sources.
    </agent>
    <agent name="trade_agent">
      Executes BUY/SELL orders or portfolio rebalancing.
      <rules>
        <rule>consider "conversation_state" and decide if its required to take trade or not .</rule>
        <rule>Do not execute trades without explicit clarity or confirmation.</rule>
      </rules>
    </agent>
  </agent_directory>

  <decision_process>
    <step number="1">
      Interpret the <user_query> — extract core intent (informational, analytical, or trading action).
    </step>
    <step number="2">
      Check if you already have enough data to respond directly. If yes, do so — no agent needed.
    </step>
    <step number="3">
      If an agent is needed, select exactly one from:
      ["crypto_price_agent", "news_sentiment_agent", "websearch_agent", "trade_agent", "FINISH"].
    </step>
    <step number="4">
      Rewrite the query minimally for that agent (concise, actionable, context-aware).
    </step>
    <step number="5">
      Explain clearly why that agent and task were chosen.
    </step>
  </decision_process>

  <output_instructions>
    <format>
      Respond **strictly** in JSON as follows:
      {{
        "selected_agent": "<agent_name or FINISH>",
        "task": "<exact sub-query or instruction for that agent>",
        "reasoning": "<brief reasoning behind your choice>"
      }}
    </format>
  </output_instructions>
</system>
"""



    response = llm.invoke(system_prompt)

    # --- normalize response to string ---
    if hasattr(response, "content"):
        raw_text = response.content
    elif isinstance(response, str):
        raw_text = response
    else:
        raw_text = str(response)

    # --- try parse as JSON ---
    import json
    try:
        parsed = json.loads(raw_text)
    except Exception:
        # fallback: strip to nearest JSON object
        json_str = raw_text[raw_text.find("{"): raw_text.rfind("}") + 1]
        parsed = json.loads(json_str)

    selected_agent = parsed.get("selected_agent")
    task = parsed.get("task")
    reasoning = parsed.get("reasoning")

    # Ensure task is a string, not a dict or other type
    if isinstance(task, dict):
        task = json.dumps(task,default=str)
    elif task is None:
        task = ""
    else:
        task = str(task)

    print(system_prompt)
    # handle FINISH
    if selected_agent == "FINISH":
        # Generate comprehensive final response based on all collected context
        final_response_prompt = f"""
Be precise and to the point .Convey all message and action in less words so that user can understand easily. You have agents who worked to fulfill your guidance.

User's original query: {state.user_query}

All collected information from agents:
{json.dumps(state.context, indent=2,default=str)}

Agent execution history:
{chr(10).join([f"Step {d.step}: {d.selected_agent} - {d.task}" for d in state.decisions])}

Agent outputs:
{chr(10).join([f"{s.agent_name}: {s.agent_output}" for s in state.agent_states])}

Trade Executions Completed:
{json.dumps([t.dict() for t in state.trade_executions], indent=2,default=str)}

Previous conversation context:
Request summary: {state.request_summary}
Response summary: {state.response_summary}

Task: Synthesize all the above information into a clear, comprehensive, and well-structured response that directly answers the user's query.

Guidelines:
- Provide specific data points (crypto prices, quantities, percentages, sentiment scores, portfolio impact, etc.)
- Structure the response logically with proper formatting
- Be concise but complete
- If multiple items were requested, address each one
- Include relevant context and insights
- If trades were executed, confirm them clearly with details
- Do not mention agent names or internal processes
- Present the information as if you gathered it yourself
- Include risk warnings where appropriate

Provide your final response as plain text (not JSON).
"""

        final_response = llm.invoke(final_response_prompt)

        # Extract content from response
        if hasattr(final_response, "content"):
            state.final_output = final_response.content
        elif isinstance(final_response, str):
            state.final_output = final_response
        else:
            state.final_output = str(final_response)

        state.current_task = None
        return state

    # record decision
    decision = SupervisorDecision(
        step=step,
        selected_agent=selected_agent,
        reasoning=reasoning,
        task=task
    )
    state.decisions.append(decision)
    state.current_task = task

    return state

