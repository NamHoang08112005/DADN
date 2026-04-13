use doandanganh;
-- User Table
CREATE TABLE Users (
    User_Id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(200) UNIQUE,
    pass VARCHAR(255),
    Name VARCHAR(100),
    Date_of_Birth DATE,
    Social_Security_Number VARCHAR(15)
);

-- Device/Sensor Type Table
CREATE TABLE DeviceSensorType (
    Serial_number VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100),
    Model_number VARCHAR(50),
    Description TEXT
);

-- Device/Sensor Table
CREATE TABLE DeviceSensor (
    Device_Id INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Properties TEXT,
    User_Id INT,
    Serial_number VARCHAR(50),
    FOREIGN KEY (User_Id) REFERENCES Users(User_Id),
    FOREIGN KEY (Serial_number) REFERENCES DeviceSensorType(Serial_number)
);

-- Automation Rule Table
CREATE TABLE AutomationRule (
    Rule_Id INT AUTO_INCREMENT PRIMARY KEY,
    Date TIMESTAMP,
    Rule_Description TEXT,
    Device_Id INT,
    FOREIGN KEY (Device_Id) REFERENCES DeviceSensor(Device_Id)
);

-- User modifies Automation Rules
CREATE TABLE UserModifyRule (
	ModificationId INT AUTO_INCREMENT PRIMARY KEY,
    User_Id INT,
    Rule_Id INT,
    FOREIGN KEY (User_Id) REFERENCES Users(User_Id),
    FOREIGN KEY (Rule_Id) REFERENCES AutomationRule(Rule_Id)
);

-- Device State Log Table
CREATE TABLE DeviceStateLog (
    Log_Id INT AUTO_INCREMENT PRIMARY KEY,
    Activities TEXT,
    Device_Id INT,
    User_Id INT NULL,
    Rule_Id INT NULL,
    Date TIMESTAMP,
    FOREIGN KEY (User_Id) REFERENCES Users(User_Id),
    FOREIGN KEY (Device_Id) REFERENCES DeviceSensor(Device_Id),
    FOREIGN KEY (Rule_Id) REFERENCES AutomationRule(Rule_Id),
    CHECK (
		(User_Id IS NOT NULL AND Rule_Id IS NULL) OR
		(User_Id IS NULL AND Rule_Id IS NOT NULL)
	)
);

-- Insert Users
INSERT INTO Users (Name,username, pass, Date_of_Birth, Social_Security_Number)
VALUES 
('Alice Smith', 'alice', '1234', '1985-04-12', '123-45-6789'),
('Bob Johnson', 'john', '4321', '1990-07-23', '987-65-4321');

-- Insert Device/Sensor Types
INSERT INTO DeviceSensorType (Serial_number, Name, Model_number, Description)
VALUES
('SN001', 'Smart Thermostat', 'T1000', 'Regulates temperature'),
('SN002', 'Light Sensor', 'M2000', 'Detects movement');

-- Insert Device/Sensors
INSERT INTO DeviceSensor (Name, Properties, User_Id, Serial_number)
VALUES
('Living Room Thermostat', '{ "minRange" : "-10", "maxRange" : "100"}', 1, 'SN001'),
('Front Door Light Sensor', '{"maxRange" : "20"}', 2, 'SN002');

-- Insert Automation Rules
INSERT INTO AutomationRule (Date, Rule_Description, Device_Id)
VALUES
(NOW(), '{"content" : "Turn on heating if temperature drops below 18°C"}', 1),
(NOW(), '{ "content" : "Send alert when motion is detected at night"}', 2);

-- Insert UserModifyRule
INSERT INTO UserModifyRule (User_Id, Rule_Id)
VALUES
(1, 1),
(2, 2);

-- Insert DeviceStateLog
INSERT INTO DeviceStateLog ( Activities, Device_Id, User_Id, Rule_Id, Date)
VALUES
( 'User manually set temperature to 22°C', 1, 1, NULL, NOW()),
( 'Rule activated heating due to low temperature', 1, NULL, 1, NOW()),
( 'Motion detected and alert sent', 2, NULL, 2, NOW());




