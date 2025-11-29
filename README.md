# **과제 관리 서비스 REST API**
## **프로젝트 개요**

본 프로젝트는 Express.js를 사용하여 RESTful API의 기본 구조를 실습하기 위해 제작하였습니다.
과제(Assignment) 데이터를 관리하는 서비스를 구현하였으며,
HTTP 메소드별로 **POST / GET / PUT / DELETE** 기능을 두 개씩, 총 8개의 API를 작성하였습니다.

또한 **요청 로깅 미들웨어, 에러 처리 미들웨어, 표준 응답 구조 적용, 다양한 HTTP 상태 코드 반환** 등
과제 요구사항을 충족하도록 설계 및 구현하였습니다.

---
## **🛠 기술 스택**
| 항목 | 사용 기술 |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express |
| Test Tool | Postman |
| Architecture | REST API |
---

## 공통 응답 구조
✔ **성공 응답 예시**
```
{
  "status": "success",
  "data": { ... }
}
```

❌ **오류 응답 예시**
```
{
  "status": "error",
  "data": {
    "message": "오류 메시지"
  }
}
```

응답 포맷을 통일하여 클라이언트에서 일관된 방식으로 처리할 수 있도록 설계하였습니다.

---
## **API 목록**
| Method | Endpoint | 설명 | 성공 코드 | 오류 코드 |
|--------|-----------|--------|------------|------------|
| POST | /api/assignments | 과제 생성 | 201 | 400 |
| POST | /api/assignments/:id/submit | 제출 처리 | 200 | 404, 500 |
| GET | /api/assignments | 전체 조회 | 200 | 503 |
| GET | /api/assignments/:id | 상세 조회 | 200 | 404 |
| PUT | /api/assignments/:id | 전체 수정 | 200 | 404, 400 |
| PUT | /api/assignments/:id/status | 상태만 수정 | 200 | 404, 400 |
| DELETE | /api/assignments/:id | 개별 삭제 | 200 | 404 |
| DELETE | /api/assignments | 전체 삭제 | 200 | 404, 503 |

---
## **미들웨어 구성**
| 미들웨어 | 설명 |
|-----------|--------|
| 요청 로깅 | 요청 메소드, URL, 처리 시간, 상태 코드 출력 |
| 강제 에러 발생 | ?forceError=true 사용 시 500 에러 발생 테스트 |
| 에러 처리 | 5xx 서버 에러 처리 |
| 404 처리 | 정의되지 않은 경로 요청 시 404 반환 |

---

## Postman 테스트 요약
**POST 요청**
- 정상 데이터 입력 시 **201 Created**
- 필수 값 누락 시 **400 Bad Request**
- 제출 처리 성공 시 상태 `submitted`로 변경
- 존재하지 않는 ID 제출 시 **404 Not Found**

**GET 요청**
- 전체 목록 조회 시 **200 OK**
- `?maintenance=true` 사용 시 **503 Service Unavailable**
- 특정 ID 조회 성공 시 **200 OK**, 없을 시 **404 Not Found**

**PUT 요청**
- 전체 수정 처리 시 **200 OK**
- 필수 값 누락 시 **400 Bad Request**
- 수정 대상 없음 시 **404 Not Found**
- 상태만 수정 가능, 문자열 이외 입력 시 **400 Bad Request**

**DELETE 요청**
- 특정 과제 삭제 시 **200 OK**
- 존재하지 않는 ID 삭제 시 **404 Not Found**
- 전체 삭제 후 재요청 시 **404 Not Found**
- `?maintenance=true` 사용 시 **503 Service Unavailable**
