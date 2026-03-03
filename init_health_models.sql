-- 设置字符集
SET NAMES utf8mb4;

-- 清理并重新创建健康模型库表
DROP TABLE IF EXISTS `health_record`;
DROP TABLE IF EXISTS `health_model`;

CREATE TABLE `health_model` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `name` VARCHAR(100) NOT NULL COMMENT '模型名称',
    `unit` VARCHAR(50) COMMENT '单位',
    `symbol` VARCHAR(50) COMMENT '符号',
    `icon` VARCHAR(100) COMMENT '图标名称',
    `icon_color` VARCHAR(20) DEFAULT '#303133' COMMENT '图标颜色',
    `description` VARCHAR(500) COMMENT '模型简介',
    `threshold` VARCHAR(100) COMMENT '正常阈值范围',
    `type` TINYINT DEFAULT 0 COMMENT '类型 0:公共模型 1:私人模型',
    `user_id` INT COMMENT '创建用户ID（公共模型可为空）',
    `status` TINYINT DEFAULT 1 COMMENT '审核状态 0:待审核 1:已通过 2:未通过',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康模型表';

CREATE TABLE `health_record` (
    `id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    `model_id` INT NOT NULL COMMENT '关联模型ID',
    `user_id` INT NOT NULL COMMENT '用户ID',
    `record_value` VARCHAR(50) NOT NULL COMMENT '记录数值',
    `record_date` DATE NOT NULL COMMENT '记录日期',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX `idx_user_model` (`user_id`, `model_id`),
    INDEX `idx_record_date` (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康记录数据表';

-- 初始化基准公共模型数据
INSERT INTO `health_model` (`name`, `unit`, `symbol`, `icon`, `icon_color`, `description`, `threshold`, `type`, `status`) VALUES
('心率', '次 / 分钟', 'HR', 'HeartIcon', '#e74c3c', '心率是指心脏每分钟跳动的次数，是反映心血管功能的重要指标。正常成年人静息状态下心率一般在 60-100 次 / 分钟，运动员或长期锻炼者可能偏低，属于正常现象。', '60,100', 0, 1),
('身体质量指数（BMI）', '(该模型暂无数值单位)', 'BMI', 'ScaleIcon', '#34495e', 'BMI是通过身高和体重计算得出的数值，用于衡量身体肥胖程度。正常范围通常在 18.5-23.9 之间。', '18.5,23.9', 0, 1),
('血压【低压】', '毫米汞柱', 'BP', 'BloodPressureIcon', '#e74c3c', '舒张压（低压）是心脏舒张时动脉内的压力。正常范围为 60-89 mmHg。', '60,89', 0, 1),
('血压【高压】', '毫米汞柱', 'BP', 'BloodPressureIcon', '#e74c3c', '收缩压（高压）是心脏收缩时动脉内的压力。正常范围为 90-139 mmHg。', '90,139', 0, 1),
('血糖', '毫摩尔 / 升', 'BG', 'BloodSugarIcon', '#3498db', '血糖水平反映身体代谢糖的能力。空腹血糖正常范围通常在 3.9-6.1 mmol/L 之间。', '3.9,6.1', 0, 1),
('血氧饱和度', '%', 'SpO2', 'OxygenIcon', '#2c3e50', '血氧饱和度是血液中氧气与血红蛋白结合的容量占全部血红蛋白容量的百分比。正常范围通常在 95%-100%。', '95,100', 0, 1),
('体脂率', '%', 'BF%', 'BodyFatIcon', '#3498db', '体脂率是指人体内脂肪重量在人体总体重中所占的比例。成年男性正常范围为 15%-18%，女性为 25%-28%。', '15,28', 0, 1),
('睡眠时长', '小时', 'Sleep', 'SleepIcon', '#9b59b6', '每日睡眠总时长。建议成年人保持 7-9 小时的高质量睡眠。', '7,9', 0, 1),
('体重', '千克', 'Weight', 'WeightIcon', '#27ae60', '人体的总重量。是反映营养状况和健康变化的最基本指标。', NULL, 0, 1);
