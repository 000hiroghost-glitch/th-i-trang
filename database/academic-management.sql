/*
  Academic Management System - SQL Server
  Chay mot lan tren database dich bang SQL Server 2016 SP1 tro len.
  Tat ca tham so du lieu tu ung dung phai duoc truyen vao Stored Procedure.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

/* Danh tinh, phan quyen va ho so */
CREATE TABLE dbo.Roles
(
    RoleId       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Roles PRIMARY KEY,
    RoleCode     VARCHAR(30) NOT NULL CONSTRAINT UQ_Roles_RoleCode UNIQUE,
    RoleName     NVARCHAR(100) NOT NULL
);
GO

INSERT INTO dbo.Roles (RoleCode, RoleName)
SELECT v.RoleCode, v.RoleName
FROM (VALUES
    ('ADMIN', N'Quản trị viên'),
    ('INSTRUCTOR', N'Giảng viên'),
    ('STUDENT', N'Sinh viên')
) AS v(RoleCode, RoleName)
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.Roles AS r
    WHERE r.RoleCode = v.RoleCode
);
GO

CREATE TABLE dbo.Students
(
    StudentId       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Students PRIMARY KEY,
    StudentCode     NVARCHAR(30) NOT NULL,
    FirstName       NVARCHAR(100) NOT NULL,
    LastName        NVARCHAR(100) NOT NULL,
    Email           NVARCHAR(254) NULL,
    Phone           NVARCHAR(30) NULL,
    DateOfBirth     DATE NULL,
    Gender          NVARCHAR(10) NULL,
    Address         NVARCHAR(500) NULL,
    EnrollmentYear  SMALLINT NOT NULL,
    StudentStatus   VARCHAR(20) NOT NULL CONSTRAINT DF_Students_Status DEFAULT ('ACTIVE'),
    IsDeleted       BIT NOT NULL CONSTRAINT DF_Students_IsDeleted DEFAULT (0),
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Students_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Students_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Students_Gender
        CHECK (Gender IS NULL OR Gender IN (N'Nam', N'Nữ', N'Khác')),
    CONSTRAINT CK_Students_Status
        CHECK (StudentStatus IN ('ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN')),
    CONSTRAINT CK_Students_EnrollmentYear
        CHECK (EnrollmentYear BETWEEN 1900 AND 2200)
);
GO

CREATE UNIQUE INDEX UX_Students_StudentCode_Active
    ON dbo.Students (StudentCode)
    WHERE IsDeleted = 0;
CREATE UNIQUE INDEX UX_Students_Email_Active
    ON dbo.Students (Email)
    WHERE IsDeleted = 0 AND Email IS NOT NULL;
GO

CREATE TABLE dbo.Instructors
(
    InstructorId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Instructors PRIMARY KEY,
    InstructorCode  NVARCHAR(30) NOT NULL,
    FirstName       NVARCHAR(100) NOT NULL,
    LastName        NVARCHAR(100) NOT NULL,
    Email           NVARCHAR(254) NULL,
    Phone           NVARCHAR(30) NULL,
    Department      NVARCHAR(150) NULL,
    IsDeleted       BIT NOT NULL CONSTRAINT DF_Instructors_IsDeleted DEFAULT (0),
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Instructors_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Instructors_UpdatedAt DEFAULT (SYSUTCDATETIME())
);
GO

CREATE UNIQUE INDEX UX_Instructors_Code_Active
    ON dbo.Instructors (InstructorCode)
    WHERE IsDeleted = 0;
CREATE UNIQUE INDEX UX_Instructors_Email_Active
    ON dbo.Instructors (Email)
    WHERE IsDeleted = 0 AND Email IS NOT NULL;
GO

CREATE TABLE dbo.UserAccounts
(
    UserId          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserAccounts PRIMARY KEY,
    Username        NVARCHAR(100) NOT NULL,
    PasswordHash    VARCHAR(255) NOT NULL,
    RoleId          INT NOT NULL,
    StudentId       INT NULL,
    InstructorId    INT NULL,
    IsActive        BIT NOT NULL CONSTRAINT DF_UserAccounts_IsActive DEFAULT (1),
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_UserAccounts_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT UQ_UserAccounts_Username UNIQUE (Username),
    CONSTRAINT FK_UserAccounts_Roles
        FOREIGN KEY (RoleId) REFERENCES dbo.Roles (RoleId),
    CONSTRAINT FK_UserAccounts_Students
        FOREIGN KEY (StudentId) REFERENCES dbo.Students (StudentId),
    CONSTRAINT FK_UserAccounts_Instructors
        FOREIGN KEY (InstructorId) REFERENCES dbo.Instructors (InstructorId),
    CONSTRAINT CK_UserAccounts_Profile
        CHECK (StudentId IS NULL OR InstructorId IS NULL)
);
GO

CREATE UNIQUE INDEX UX_UserAccounts_Student
    ON dbo.UserAccounts (StudentId)
    WHERE StudentId IS NOT NULL;
CREATE UNIQUE INDEX UX_UserAccounts_Instructor
    ON dbo.UserAccounts (InstructorId)
    WHERE InstructorId IS NOT NULL;
GO

/* Danh muc hoc phan va lop hoc phan */
CREATE TABLE dbo.Courses
(
    CourseId        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Courses PRIMARY KEY,
    CourseCode      NVARCHAR(30) NOT NULL,
    CourseName      NVARCHAR(200) NOT NULL,
    Credits         TINYINT NOT NULL,
    Description     NVARCHAR(2000) NULL,
    IsActive        BIT NOT NULL CONSTRAINT DF_Courses_IsActive DEFAULT (1),
    IsDeleted       BIT NOT NULL CONSTRAINT DF_Courses_IsDeleted DEFAULT (0),
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Courses_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Courses_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT CK_Courses_Credits CHECK (Credits BETWEEN 1 AND 30)
);
GO

CREATE UNIQUE INDEX UX_Courses_CourseCode_Active
    ON dbo.Courses (CourseCode)
    WHERE IsDeleted = 0;
GO

CREATE TABLE dbo.ClassSections
(
    ClassSectionId  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClassSections PRIMARY KEY,
    CourseId        INT NOT NULL,
    InstructorId    INT NOT NULL,
    SemesterCode    NVARCHAR(30) NOT NULL,
    SectionCode     NVARCHAR(30) NOT NULL,
    Capacity        SMALLINT NOT NULL,
    SectionStatus   VARCHAR(20) NOT NULL CONSTRAINT DF_ClassSections_Status DEFAULT ('OPEN'),
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_ClassSections_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_ClassSections_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_ClassSections_Courses
        FOREIGN KEY (CourseId) REFERENCES dbo.Courses (CourseId),
    CONSTRAINT FK_ClassSections_Instructors
        FOREIGN KEY (InstructorId) REFERENCES dbo.Instructors (InstructorId),
    CONSTRAINT UQ_ClassSections_Semester_Section
        UNIQUE (SemesterCode, SectionCode),
    CONSTRAINT CK_ClassSections_Capacity CHECK (Capacity > 0),
    CONSTRAINT CK_ClassSections_Status
        CHECK (SectionStatus IN ('OPEN', 'CLOSED', 'CANCELLED', 'COMPLETED'))
);
GO

CREATE INDEX IX_ClassSections_Course_Semester
    ON dbo.ClassSections (CourseId, SemesterCode);
CREATE INDEX IX_ClassSections_Instructor_Semester
    ON dbo.ClassSections (InstructorId, SemesterCode);
GO

CREATE TABLE dbo.ClassSchedules
(
    ClassScheduleId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ClassSchedules PRIMARY KEY,
    ClassSectionId  INT NOT NULL,
    DayOfWeek       TINYINT NOT NULL,
    StartTime       TIME(0) NOT NULL,
    EndTime         TIME(0) NOT NULL,
    Room            NVARCHAR(100) NOT NULL,
    CONSTRAINT FK_ClassSchedules_ClassSections
        FOREIGN KEY (ClassSectionId) REFERENCES dbo.ClassSections (ClassSectionId),
    CONSTRAINT CK_ClassSchedules_DayOfWeek CHECK (DayOfWeek BETWEEN 1 AND 7),
    CONSTRAINT CK_ClassSchedules_Time CHECK (EndTime > StartTime)
);
GO

CREATE INDEX IX_ClassSchedules_Section_Day
    ON dbo.ClassSchedules (ClassSectionId, DayOfWeek);
GO

/* Dang ky tin chi va ket qua hoc tap */
CREATE TABLE dbo.Enrollments
(
    EnrollmentId    INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Enrollments PRIMARY KEY,
    StudentId       INT NOT NULL,
    ClassSectionId  INT NOT NULL,
    EnrollmentStatus VARCHAR(20) NOT NULL CONSTRAINT DF_Enrollments_Status DEFAULT ('REGISTERED'),
    EnrolledAt      DATETIME2(0) NOT NULL CONSTRAINT DF_Enrollments_EnrolledAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Enrollments_Students
        FOREIGN KEY (StudentId) REFERENCES dbo.Students (StudentId),
    CONSTRAINT FK_Enrollments_ClassSections
        FOREIGN KEY (ClassSectionId) REFERENCES dbo.ClassSections (ClassSectionId),
    CONSTRAINT CK_Enrollments_Status
        CHECK (EnrollmentStatus IN ('REGISTERED', 'CANCELLED', 'COMPLETED'))
);
GO

CREATE UNIQUE INDEX UX_Enrollments_Student_ClassSection_Registered
    ON dbo.Enrollments (StudentId, ClassSectionId)
    WHERE EnrollmentStatus = 'REGISTERED';
CREATE INDEX IX_Enrollments_ClassSection_Status
    ON dbo.Enrollments (ClassSectionId, EnrollmentStatus);
GO

CREATE TABLE dbo.Grades
(
    GradeId         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Grades PRIMARY KEY,
    EnrollmentId    INT NOT NULL,
    AssessmentType  VARCHAR(20) NOT NULL,
    Score           DECIMAL(5,2) NOT NULL,
    MaxScore        DECIMAL(5,2) NOT NULL CONSTRAINT DF_Grades_MaxScore DEFAULT (10.00),
    RecordedByUserId INT NULL,
    Notes           NVARCHAR(1000) NULL,
    IsDeleted       BIT NOT NULL CONSTRAINT DF_Grades_IsDeleted DEFAULT (0),
    CreatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Grades_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt       DATETIME2(0) NOT NULL CONSTRAINT DF_Grades_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_Grades_Enrollments
        FOREIGN KEY (EnrollmentId) REFERENCES dbo.Enrollments (EnrollmentId),
    CONSTRAINT FK_Grades_UserAccounts
        FOREIGN KEY (RecordedByUserId) REFERENCES dbo.UserAccounts (UserId),
    CONSTRAINT CK_Grades_AssessmentType
        CHECK (AssessmentType IN ('ATTENDANCE', 'MIDTERM', 'FINAL', 'OTHER')),
    CONSTRAINT CK_Grades_Score
        CHECK (MaxScore > 0 AND Score >= 0 AND Score <= MaxScore)
);
GO

CREATE UNIQUE INDEX UX_Grades_Enrollment_Assessment_Active
    ON dbo.Grades (EnrollmentId, AssessmentType)
    WHERE IsDeleted = 0;
GO

/* Stored Procedures: Sinh vien */
CREATE OR ALTER PROCEDURE dbo.Student_Create
    @StudentCode NVARCHAR(30),
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(254) = NULL,
    @Phone NVARCHAR(30) = NULL,
    @DateOfBirth DATE = NULL,
    @Gender NVARCHAR(10) = NULL,
    @Address NVARCHAR(500) = NULL,
    @EnrollmentYear SMALLINT,
    @StudentStatus VARCHAR(20) = 'ACTIVE'
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.Students WHERE StudentCode = @StudentCode AND IsDeleted = 0)
        THROW 50001, N'Mã sinh viên đã tồn tại.', 1;
    IF @Email IS NOT NULL
       AND EXISTS (SELECT 1 FROM dbo.Students WHERE Email = @Email AND IsDeleted = 0)
        THROW 50002, N'Email đã được sử dụng.', 1;

    INSERT INTO dbo.Students
        (StudentCode, FirstName, LastName, Email, Phone, DateOfBirth, Gender,
         Address, EnrollmentYear, StudentStatus)
    OUTPUT
        INSERTED.StudentId, INSERTED.StudentCode, INSERTED.FirstName, INSERTED.LastName,
        INSERTED.Email, INSERTED.Phone, INSERTED.DateOfBirth, INSERTED.Gender,
        INSERTED.Address, INSERTED.EnrollmentYear, INSERTED.StudentStatus,
        INSERTED.CreatedAt, INSERTED.UpdatedAt
    VALUES
        (@StudentCode, @FirstName, @LastName, @Email, @Phone, @DateOfBirth, @Gender,
         @Address, @EnrollmentYear, @StudentStatus);
END;
GO

CREATE OR ALTER PROCEDURE dbo.Student_GetById
    @StudentId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT StudentId, StudentCode, FirstName, LastName, Email, Phone, DateOfBirth,
           Gender, Address, EnrollmentYear, StudentStatus, CreatedAt, UpdatedAt
    FROM dbo.Students
    WHERE StudentId = @StudentId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Student_List
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Search NVARCHAR(100) = NULL,
    @StudentStatus VARCHAR(20) = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 OR @PageSize < 1 OR @PageSize > 200
        THROW 50003, N'Thông tin phân trang không hợp lệ.', 1;

    SELECT @TotalCount = COUNT(*)
    FROM dbo.Students
    WHERE IsDeleted = 0
      AND (@StudentStatus IS NULL OR StudentStatus = @StudentStatus)
      AND
      (
          @Search IS NULL
          OR StudentCode LIKE N'%' + @Search + N'%'
          OR FirstName LIKE N'%' + @Search + N'%'
          OR LastName LIKE N'%' + @Search + N'%'
          OR Email LIKE N'%' + @Search + N'%'
      );

    SELECT StudentId, StudentCode, FirstName, LastName, Email, Phone, DateOfBirth,
           Gender, Address, EnrollmentYear, StudentStatus, CreatedAt, UpdatedAt
    FROM dbo.Students
    WHERE IsDeleted = 0
      AND (@StudentStatus IS NULL OR StudentStatus = @StudentStatus)
      AND
      (
          @Search IS NULL
          OR StudentCode LIKE N'%' + @Search + N'%'
          OR FirstName LIKE N'%' + @Search + N'%'
          OR LastName LIKE N'%' + @Search + N'%'
          OR Email LIKE N'%' + @Search + N'%'
      )
    ORDER BY StudentId DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Student_Update
    @StudentId INT,
    @StudentCode NVARCHAR(30),
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Email NVARCHAR(254) = NULL,
    @Phone NVARCHAR(30) = NULL,
    @DateOfBirth DATE = NULL,
    @Gender NVARCHAR(10) = NULL,
    @Address NVARCHAR(500) = NULL,
    @EnrollmentYear SMALLINT,
    @StudentStatus VARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Students WHERE StudentId = @StudentId AND IsDeleted = 0)
        THROW 50004, N'Không tìm thấy sinh viên.', 1;
    IF EXISTS
       (SELECT 1 FROM dbo.Students
        WHERE StudentCode = @StudentCode AND StudentId <> @StudentId AND IsDeleted = 0)
        THROW 50001, N'Mã sinh viên đã tồn tại.', 1;
    IF @Email IS NOT NULL
       AND EXISTS
       (SELECT 1 FROM dbo.Students
        WHERE Email = @Email AND StudentId <> @StudentId AND IsDeleted = 0)
        THROW 50002, N'Email đã được sử dụng.', 1;

    UPDATE dbo.Students
    SET StudentCode = @StudentCode,
        FirstName = @FirstName,
        LastName = @LastName,
        Email = @Email,
        Phone = @Phone,
        DateOfBirth = @DateOfBirth,
        Gender = @Gender,
        Address = @Address,
        EnrollmentYear = @EnrollmentYear,
        StudentStatus = @StudentStatus,
        UpdatedAt = SYSUTCDATETIME()
    OUTPUT
        INSERTED.StudentId, INSERTED.StudentCode, INSERTED.FirstName, INSERTED.LastName,
        INSERTED.Email, INSERTED.Phone, INSERTED.DateOfBirth, INSERTED.Gender,
        INSERTED.Address, INSERTED.EnrollmentYear, INSERTED.StudentStatus,
        INSERTED.CreatedAt, INSERTED.UpdatedAt
    WHERE StudentId = @StudentId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Student_Delete
    @StudentId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Students
    SET IsDeleted = 1,
        UpdatedAt = SYSUTCDATETIME()
    OUTPUT INSERTED.StudentId
    WHERE StudentId = @StudentId AND IsDeleted = 0;
END;
GO

/* Stored Procedures: Mon hoc */
CREATE OR ALTER PROCEDURE dbo.Course_Create
    @CourseCode NVARCHAR(30),
    @CourseName NVARCHAR(200),
    @Credits TINYINT,
    @Description NVARCHAR(2000) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.Courses WHERE CourseCode = @CourseCode AND IsDeleted = 0)
        THROW 50011, N'Mã môn học đã tồn tại.', 1;

    INSERT INTO dbo.Courses (CourseCode, CourseName, Credits, Description, IsActive)
    OUTPUT INSERTED.CourseId, INSERTED.CourseCode, INSERTED.CourseName,
           INSERTED.Credits, INSERTED.Description, INSERTED.IsActive,
           INSERTED.CreatedAt, INSERTED.UpdatedAt
    VALUES (@CourseCode, @CourseName, @Credits, @Description, @IsActive);
END;
GO

CREATE OR ALTER PROCEDURE dbo.Course_GetById
    @CourseId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT CourseId, CourseCode, CourseName, Credits, Description, IsActive,
           CreatedAt, UpdatedAt
    FROM dbo.Courses
    WHERE CourseId = @CourseId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Course_List
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @Search NVARCHAR(100) = NULL,
    @TotalCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    IF @PageNumber < 1 OR @PageSize < 1 OR @PageSize > 200
        THROW 50012, N'Thông tin phân trang không hợp lệ.', 1;

    SELECT @TotalCount = COUNT(*)
    FROM dbo.Courses
    WHERE IsDeleted = 0
      AND
      (
          @Search IS NULL
          OR CourseCode LIKE N'%' + @Search + N'%'
          OR CourseName LIKE N'%' + @Search + N'%'
      );

    SELECT CourseId, CourseCode, CourseName, Credits, Description, IsActive,
           CreatedAt, UpdatedAt
    FROM dbo.Courses
    WHERE IsDeleted = 0
      AND
      (
          @Search IS NULL
          OR CourseCode LIKE N'%' + @Search + N'%'
          OR CourseName LIKE N'%' + @Search + N'%'
      )
    ORDER BY CourseId DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Course_Update
    @CourseId INT,
    @CourseCode NVARCHAR(30),
    @CourseName NVARCHAR(200),
    @Credits TINYINT,
    @Description NVARCHAR(2000) = NULL,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Courses WHERE CourseId = @CourseId AND IsDeleted = 0)
        THROW 50013, N'Không tìm thấy môn học.', 1;
    IF EXISTS
       (SELECT 1 FROM dbo.Courses
        WHERE CourseCode = @CourseCode AND CourseId <> @CourseId AND IsDeleted = 0)
        THROW 50011, N'Mã môn học đã tồn tại.', 1;

    UPDATE dbo.Courses
    SET CourseCode = @CourseCode,
        CourseName = @CourseName,
        Credits = @Credits,
        Description = @Description,
        IsActive = @IsActive,
        UpdatedAt = SYSUTCDATETIME()
    OUTPUT INSERTED.CourseId, INSERTED.CourseCode, INSERTED.CourseName,
           INSERTED.Credits, INSERTED.Description, INSERTED.IsActive,
           INSERTED.CreatedAt, INSERTED.UpdatedAt
    WHERE CourseId = @CourseId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Course_Delete
    @CourseId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Courses
    SET IsDeleted = 1,
        IsActive = 0,
        UpdatedAt = SYSUTCDATETIME()
    OUTPUT INSERTED.CourseId
    WHERE CourseId = @CourseId AND IsDeleted = 0;
END;
GO

/* Stored Procedures: Diem theo tung dau diem, chua ap dung trong so tong ket */
CREATE OR ALTER PROCEDURE dbo.Grade_Create
    @EnrollmentId INT,
    @AssessmentType VARCHAR(20),
    @Score DECIMAL(5,2),
    @MaxScore DECIMAL(5,2) = 10.00,
    @RecordedByUserId INT = NULL,
    @Notes NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
       (SELECT 1 FROM dbo.Enrollments
        WHERE EnrollmentId = @EnrollmentId AND EnrollmentStatus = 'REGISTERED')
        THROW 50021, N'Không tìm thấy lượt đăng ký hợp lệ để nhập điểm.', 1;
    IF EXISTS
       (SELECT 1 FROM dbo.Grades
        WHERE EnrollmentId = @EnrollmentId
          AND AssessmentType = @AssessmentType
          AND IsDeleted = 0)
        THROW 50022, N'Điểm của đầu điểm này đã tồn tại.', 1;

    INSERT INTO dbo.Grades
        (EnrollmentId, AssessmentType, Score, MaxScore, RecordedByUserId, Notes)
    OUTPUT INSERTED.GradeId, INSERTED.EnrollmentId, INSERTED.AssessmentType,
           INSERTED.Score, INSERTED.MaxScore, INSERTED.RecordedByUserId,
           INSERTED.Notes, INSERTED.CreatedAt, INSERTED.UpdatedAt
    VALUES
        (@EnrollmentId, @AssessmentType, @Score, @MaxScore, @RecordedByUserId, @Notes);
END;
GO

CREATE OR ALTER PROCEDURE dbo.Grade_GetById
    @GradeId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT GradeId, EnrollmentId, AssessmentType, Score, MaxScore,
           RecordedByUserId, Notes, CreatedAt, UpdatedAt
    FROM dbo.Grades
    WHERE GradeId = @GradeId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Grade_ListByEnrollment
    @EnrollmentId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT GradeId, EnrollmentId, AssessmentType, Score, MaxScore,
           RecordedByUserId, Notes, CreatedAt, UpdatedAt
    FROM dbo.Grades
    WHERE EnrollmentId = @EnrollmentId AND IsDeleted = 0
    ORDER BY GradeId;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Grade_Update
    @GradeId INT,
    @AssessmentType VARCHAR(20),
    @Score DECIMAL(5,2),
    @MaxScore DECIMAL(5,2),
    @RecordedByUserId INT = NULL,
    @Notes NVARCHAR(1000) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Grades WHERE GradeId = @GradeId AND IsDeleted = 0)
        THROW 50023, N'Không tìm thấy bản ghi điểm.', 1;
    IF EXISTS
       (SELECT 1 FROM dbo.Grades AS currentGrade
        WHERE currentGrade.GradeId = @GradeId
          AND currentGrade.IsDeleted = 0
          AND EXISTS
          (
              SELECT 1
              FROM dbo.Grades AS otherGrade
              WHERE otherGrade.EnrollmentId = currentGrade.EnrollmentId
                AND otherGrade.AssessmentType = @AssessmentType
                AND otherGrade.GradeId <> @GradeId
                AND otherGrade.IsDeleted = 0
          ))
        THROW 50022, N'Điểm của đầu điểm này đã tồn tại.', 1;

    UPDATE dbo.Grades
    SET AssessmentType = @AssessmentType,
        Score = @Score,
        MaxScore = @MaxScore,
        RecordedByUserId = @RecordedByUserId,
        Notes = @Notes,
        UpdatedAt = SYSUTCDATETIME()
    OUTPUT INSERTED.GradeId, INSERTED.EnrollmentId, INSERTED.AssessmentType,
           INSERTED.Score, INSERTED.MaxScore, INSERTED.RecordedByUserId,
           INSERTED.Notes, INSERTED.CreatedAt, INSERTED.UpdatedAt
    WHERE GradeId = @GradeId AND IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE dbo.Grade_Delete
    @GradeId INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Grades
    SET IsDeleted = 1,
        UpdatedAt = SYSUTCDATETIME()
    OUTPUT INSERTED.GradeId
    WHERE GradeId = @GradeId AND IsDeleted = 0;
END;
GO
