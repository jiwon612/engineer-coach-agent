# 🎓 엔지니어 학습 코치 AI Agent

알고리즘 문제 풀이, CS 개념 설명, 코드 리뷰를 도와주는 학습 코치 AI Agent입니다.  
순수 프론트엔드(HTML/CSS/JS) 정적 사이트로, 사용자가 입력한 API 키로 브라우저에서 직접 Claude/OpenAI API를 호출합니다.  
API 키는 브라우저 `localStorage`에만 저장되며 어떤 서버에도 전송되지 않습니다.

<table>
  <tr>
    <td align="center" width="50%">
      <img src="https://github.com/user-attachments/assets/db9674f4-006c-4f53-aff7-f516ae36c202" alt="메인 화면" width="100%"/>
    </td>
    <td align="center" width="50%">
      <img src="https://github.com/user-attachments/assets/d4c9c990-840d-4cdc-ba25-9b628151ff25" alt="코드 리뷰 화면" width="100%"/>
    </td>
  </tr>
  <tr>
    <td align="center">
      <!-- 첫 번째 사진 설명을 여기에 작성하세요 -->
      <b>메인 화면</b><br/>모드 선택 및 API 키 설정
    </td>
    <td align="center">
      <!-- 두 번째 사진 설명을 여기에 작성하세요 -->
      <b>코드 리뷰 화면</b><br/>코드 입력 및 AI 피드백 출력
    </td>
  </tr>
</table>

## 기능
- 🧩 알고리즘 문제 풀이: 힌트 강도(살짝 힌트 / 방향 제시 / 정답까지) 조절 가능, 소크라테스식 질문으로 사고 유도
- 📘 CS 개념 설명: 난이도(초급/중급/고급)에 따라 비유와 깊이 조절
- 🔍 코드 리뷰: 가독성, 효율성, 버그, 더 나은 패턴 관점에서 피드백

## 로컬 실행
별도 빌드 과정 없이 `index.html`을 브라우저로 열거나, 정적 서버로 실행하면 됩니다.

```bash
python -m http.server 8000
# http://localhost:8000 접속
```

## 사용 방법
1. 처음 접속 시 뜨는 설정 모달에서 Provider(Anthropic/OpenAI) 선택 후 본인 API 키 입력
2. 좌측에서 모드(알고리즘/개념/리뷰) 선택
3. 질문이나 코드를 입력하고 전송
