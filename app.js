// app.js
const express = require('express');
const app = express();
const PORT = 3000;

/**
 * 공통 응답 유틸
 * - 응답 포맷 통일: { status, data }
 */
function sendSuccess(res, httpStatus, data) {
    res.status(httpStatus).json({
        status: 'success',
        data
    });
}

function sendError(res, httpStatus, message, extraData = {}) {
    res.status(httpStatus).json({
        status: 'error',
        data: {
            message,
            ...extraData
        }
    });
}

/**
 * 미들웨어 1: 요청 로그
 */
function requestLogger(req, res, next) {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        console.log(
            `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`
        );
    });
    next();
}

/**
 * 미들웨어 2: 강제 에러 트리거
 * ?forceError=true 이면 500에러 발생
 */
function errorTrigger(req, res, next) {
    if (req.query.forceError === 'true') {
        const err = new Error('강제로 발생시킨 서버 에러');
        err.status = 500;
        return next(err);
    }
    next();
}

app.use(express.json());
app.use(requestLogger);
app.use(errorTrigger);

/**
 * 인메모리 "DB"
 * 과제(assignment) 목록
 */
let assignments = []; // { id, title, course, dueDate, status }
let currentId = 1;

/**
 * ======================
 *   POST (2개)
 * ======================
 */

// POST 1: 새 과제 등록
// body: { title, course, dueDate }
// - 성공: 201
// - title, course 없으면: 400
app.post('/api/assignments', (req, res, next) => {
    try {
        const { title, course, dueDate } = req.body;

        if (!title || !course) {
            return sendError(res, 400, 'title과 course는 필수입니다.');
        }

        const newAssignment = {
            id: currentId++,
            title,
            course,
            dueDate: dueDate || null,
            status: 'pending' // pending | submitted | late (단순화)
        };

        assignments.push(newAssignment);
        return sendSuccess(res, 201, { assignment: newAssignment });
    } catch (err) {
        next(err);
    }
});

// POST 2: 과제 제출 처리
// - 성공: 200
// - 없음: 404
// - body.crash === true 면 500 (테스트용)
app.post('/api/assignments/:id/submit', (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        const assignment = assignments.find((a) => a.id === id);

        if (!assignment) {
            return sendError(res, 404, '해당 ID의 과제를 찾을 수 없습니다.', { id });
        }

        if (req.body && req.body.crash === true) {
            throw new Error('테스트용 500 에러');
        }

        assignment.status = 'submitted';
        return sendSuccess(res, 200, { assignment });
    } catch (err) {
        next(err);
    }
});

/**
 * ======================
 *   GET (2개)
 * ======================
 */

// GET 1: 전체 과제 조회
// - 성공: 200
// - ?maintenance=true 이면 503
app.get('/api/assignments', (req, res) => {
    if (req.query.maintenance === 'true') {
        return sendError(
            res,
            503,
            '현재 과제 관리 서비스가 점검 중입니다. 나중에 다시 시도해주세요.',
            { timestamp: new Date().toISOString() }
        );
    }

    return sendSuccess(res, 200, { assignments });
});

// GET 2: 특정 과제 상세 조회
// - 성공: 200
// - 없음: 404
app.get('/api/assignments/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const assignment = assignments.find((a) => a.id === id);

    if (!assignment) {
        return sendError(res, 404, '해당 ID의 과제를 찾을 수 없습니다.', { id });
    }

    return sendSuccess(res, 200, { assignment });
});

/**
 * ======================
 *   PUT (2개)
 * ======================
 */

// PUT 1: 과제 정보 전체 수정
// body: { title, course, dueDate, status }
// - 성공: 200
// - 없음: 404
// - title, course 없으면: 400
app.put('/api/assignments/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { title, course, dueDate, status } = req.body;

    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) {
        return sendError(res, 404, '해당 ID의 과제를 찾을 수 없습니다.', { id });
    }

    if (!title || !course) {
        return sendError(res, 400, 'title과 course는 필수입니다.');
    }

    assignment.title = title;
    assignment.course = course;
    assignment.dueDate = dueDate ?? assignment.dueDate;
    if (typeof status === 'string') {
        assignment.status = status;
    }

    return sendSuccess(res, 200, { assignment });
});

// PUT 2: 과제 상태만 수정
// body: { status }
// - 성공: 200
// - 없음: 404
// - status가 문자열 아니면: 400
app.put('/api/assignments/:id/status', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) {
        return sendError(res, 404, '해당 ID의 과제를 찾을 수 없습니다.', { id });
    }

    if (typeof status !== 'string') {
        return sendError(res, 400, 'status 필드는 문자열이어야 합니다.');
    }

    assignment.status = status;
    return sendSuccess(res, 200, { assignment });
});

/**
 * ======================
 *   DELETE (2개)
 * ======================
 */

// DELETE 1: 특정 과제 삭제
// - 성공: 200
// - 없음: 404
app.delete('/api/assignments/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = assignments.findIndex((a) => a.id === id);

    if (index === -1) {
        return sendError(res, 404, '해당 ID의 과제를 찾을 수 없습니다.', { id });
    }

    const deleted = assignments.splice(index, 1)[0];
    return sendSuccess(res, 200, { deleted });
});

// DELETE 2: 전체 과제 삭제
// - 성공: 200
app.delete('/api/assignments', (req, res) => {
    const count = assignments.length;
    assignments = [];

    return sendSuccess(res, 200, {
        message: '모든 과제를 삭제했습니다.',
        deletedCount: count
    });
});

/**
 * 에러 처리 미들웨어 (5xx 담당)
 */
app.use((err, req, res, next) => {
    console.error('--- 에러 발생 ---');
    console.error(err);

    const status = err.status || 500;
    const message = status === 500 ? '서버 에러가 발생했습니다.' : err.message;

    return sendError(res, status, message);
});

/**
 * 정의되지 않은 라우트 404 처리
 */
app.use((req, res) => {
    return sendError(res, 404, '요청하신 경로를 찾을 수 없습니다.');
});

/**
 * 서버 시작
 */
app.listen(PORT, () => {
    console.log(`Assignment API server running on http://localhost:${PORT}`);
});
